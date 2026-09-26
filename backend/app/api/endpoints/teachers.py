from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models import Teacher, TeacherAssignment, ClassEntity, Subject, User
from app.schemas import (
    TeacherResponse,
    TeacherCreate,
    TeacherAssignmentResponse,
    TeacherAssignmentCreate,
)
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit

router = APIRouter(tags=["Teachers"])


@router.get("/teachers", response_model=List[TeacherResponse])
def get_teachers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    teachers = db.query(Teacher).options(
        joinedload(Teacher.assignments).joinedload(TeacherAssignment.class_entity)
    ).filter(Teacher.is_active == True).all()
    results = []
    for t in teachers:
        classes = [a.class_entity.class_name for a in t.assignments if a.class_entity and a.is_active]
        results.append(TeacherResponse(
            id=t.id,
            employee_code=t.employee_code,
            full_name=t.full_name,
            email=t.email,
            phone=t.phone,
            qualification=t.qualification,
            designation=t.designation,
            is_active=t.is_active,
            user_id=t.user_id,
            assigned_classes=list(set(classes)),
        ))
    return results


@router.post("/teachers", response_model=TeacherResponse)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    if db.query(Teacher).filter(Teacher.employee_code == payload.employee_code).first():
        raise HTTPException(status_code=400, detail="Employee code already exists")
    if db.query(Teacher).filter(Teacher.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    t = Teacher(**payload.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)

    log_audit(
        db=db,
        action="TEACHER_CREATED",
        entity="Teacher",
        entity_id=str(t.id),
        new_value=t.full_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return TeacherResponse(
        id=t.id,
        employee_code=t.employee_code,
        full_name=t.full_name,
        email=t.email,
        phone=t.phone,
        qualification=t.qualification,
        designation=t.designation,
        is_active=t.is_active,
        user_id=t.user_id,
        assigned_classes=[],
    )


@router.get("/teacher-assignments", response_model=List[TeacherAssignmentResponse])
def get_teacher_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    assignments = db.query(TeacherAssignment).filter(TeacherAssignment.is_active == True).all()
    results = []
    for a in assignments:
        results.append(TeacherAssignmentResponse(
            id=a.id,
            teacher_id=a.teacher_id,
            teacher_name=a.teacher.full_name if a.teacher else "",
            class_id=a.class_id,
            class_name=a.class_entity.class_name if a.class_entity else "",
            subject_id=a.subject_id,
            subject_name=a.subject.subject_name if a.subject_id and hasattr(a, "subject") and a.subject else None,
            assignment_type=a.assignment_type,
            is_active=a.is_active,
        ))
    return results


@router.post("/teacher-assignments", response_model=TeacherAssignmentResponse)
def create_teacher_assignment(
    payload: TeacherAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    assign = TeacherAssignment(**payload.model_dump())
    db.add(assign)
    db.commit()
    db.refresh(assign)

    teacher = db.query(Teacher).filter(Teacher.id == assign.teacher_id).first()
    class_obj = db.query(ClassEntity).filter(ClassEntity.id == assign.class_id).first()

    log_audit(
        db=db,
        action="TEACHER_ASSIGNED",
        entity="TeacherAssignment",
        entity_id=str(assign.id),
        new_value=f"Assigned {teacher.full_name if teacher else ''} to {class_obj.class_name if class_obj else ''}",
        user_id=current_user.id,
        username=current_user.username,
    )

    return TeacherAssignmentResponse(
        id=assign.id,
        teacher_id=assign.teacher_id,
        teacher_name=teacher.full_name if teacher else "",
        class_id=assign.class_id,
        class_name=class_obj.class_name if class_obj else "",
        subject_id=assign.subject_id,
        subject_name=None,
        assignment_type=assign.assignment_type,
        is_active=assign.is_active,
    )


@router.delete("/teacher-assignments/{assignment_id}")
def delete_teacher_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    assign = db.query(TeacherAssignment).filter(TeacherAssignment.id == assignment_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assign)
    db.commit()
    return {"message": "Teacher assignment removed successfully"}
