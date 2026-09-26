from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models import Student, ClassEntity, StreamEntity, AcademicSession, User
from app.schemas import StudentResponse, StudentListResponse, StudentCreate, StudentUpdate
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=StudentListResponse)
def get_students(
    class_id: Optional[int] = Query(None),
    stream_id: Optional[int] = Query(None),
    session_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(150, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = db.query(Student)

    if class_id:
        query = query.filter(Student.class_id == class_id)
    if stream_id:
        query = query.filter(Student.stream_id == stream_id)
    if session_id:
        query = query.filter(Student.academic_session_id == session_id)
    if status:
        query = query.filter(Student.student_status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.student_name.ilike(s),
                Student.scholar_number.ilike(s),
                Student.admission_number.ilike(s),
                Student.father_name.ilike(s),
            )
        )

    total = query.count()
    students = (
        query.order_by(Student.class_id, Student.roll_number)
        .offset(skip)
        .limit(limit)
        .all()
    )

    items = []
    for st in students:
        items.append(StudentResponse(
            id=st.id,
            admission_number=st.admission_number,
            scholar_number=st.scholar_number,
            roll_number=st.roll_number,
            student_name=st.student_name,
            father_name=st.father_name,
            mother_name=st.mother_name,
            date_of_birth=st.date_of_birth,
            gender=st.gender,
            contact_number=st.contact_number,
            address=st.address,
            class_id=st.class_id,
            stream_id=st.stream_id,
            academic_session_id=st.academic_session_id,
            student_status=st.student_status,
            date_of_admission=st.date_of_admission,
            class_name=st.class_entity.class_name if st.class_entity else None,
            stream_name=st.stream_entity.stream_name if st.stream_entity else None,
            session_name=st.academic_session.session_name if st.academic_session else None,
            created_at=st.created_at,
        ))

    return {"total": total, "students": items}


@router.post("", response_model=StudentResponse)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    # Check duplicate admission or scholar
    if db.query(Student).filter(Student.admission_number == payload.admission_number).first():
        raise HTTPException(status_code=400, detail="Admission number already exists")
    if db.query(Student).filter(Student.scholar_number == payload.scholar_number).first():
        raise HTTPException(status_code=400, detail="Scholar number already exists")

    st = Student(**payload.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)

    log_audit(
        db=db,
        action="STUDENT_CREATED",
        entity="Student",
        entity_id=str(st.id),
        new_value=st.student_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return StudentResponse(
        id=st.id,
        **payload.model_dump(),
        class_name=st.class_entity.class_name if st.class_entity else None,
        stream_name=st.stream_entity.stream_name if st.stream_entity else None,
        session_name=st.academic_session.session_name if st.academic_session else None,
        created_at=st.created_at,
    )


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    return StudentResponse(
        id=st.id,
        admission_number=st.admission_number,
        scholar_number=st.scholar_number,
        roll_number=st.roll_number,
        student_name=st.student_name,
        father_name=st.father_name,
        mother_name=st.mother_name,
        date_of_birth=st.date_of_birth,
        gender=st.gender,
        contact_number=st.contact_number,
        address=st.address,
        class_id=st.class_id,
        stream_id=st.stream_id,
        academic_session_id=st.academic_session_id,
        student_status=st.student_status,
        date_of_admission=st.date_of_admission,
        class_name=st.class_entity.class_name if st.class_entity else None,
        stream_name=st.stream_entity.stream_name if st.stream_entity else None,
        session_name=st.academic_session.session_name if st.academic_session else None,
        created_at=st.created_at,
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    old_name = st.student_name
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(st, key, value)

    db.commit()
    db.refresh(st)

    log_audit(
        db=db,
        action="STUDENT_UPDATED",
        entity="Student",
        entity_id=str(st.id),
        old_value=old_name,
        new_value=st.student_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return StudentResponse(
        id=st.id,
        admission_number=st.admission_number,
        scholar_number=st.scholar_number,
        roll_number=st.roll_number,
        student_name=st.student_name,
        father_name=st.father_name,
        mother_name=st.mother_name,
        date_of_birth=st.date_of_birth,
        gender=st.gender,
        contact_number=st.contact_number,
        address=st.address,
        class_id=st.class_id,
        stream_id=st.stream_id,
        academic_session_id=st.academic_session_id,
        student_status=st.student_status,
        date_of_admission=st.date_of_admission,
        class_name=st.class_entity.class_name if st.class_entity else None,
        stream_name=st.stream_entity.stream_name if st.stream_entity else None,
        session_name=st.academic_session.session_name if st.academic_session else None,
        created_at=st.created_at,
    )


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    st = db.query(Student).filter(Student.id == student_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Student not found")

    st_name = st.student_name
    db.delete(st)
    db.commit()

    log_audit(
        db=db,
        action="STUDENT_DELETED",
        entity="Student",
        entity_id=str(student_id),
        old_value=st_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return {"message": "Student deleted successfully"}
