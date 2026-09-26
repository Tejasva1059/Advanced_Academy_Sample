from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Mark, Student, Subject, Examination, ClassEntity, User
from app.schemas import MarkGridResponse, MarkRowResponse, BulkMarksEntryRequest
from app.auth.dependencies import get_current_user, check_teacher_class_access
from app.services.audit_service import log_audit

router = APIRouter(prefix="/marks", tags=["Marks"])


@router.get("/grid", response_model=MarkGridResponse)
def get_marks_grid(
    session_id: int = Query(...),
    class_id: int = Query(...),
    exam_id: int = Query(...),
    subject_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # Authorization check: teacher can only view/read if permitted
    check_teacher_class_access(current_user, class_id=class_id, is_write=False, db=db)

    class_obj = db.query(ClassEntity).filter(ClassEntity.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    exam_obj = db.query(Examination).filter(Examination.id == exam_id).first()
    if not exam_obj:
        exam_obj = db.query(Examination).filter(
            Examination.academic_session_id == session_id,
            Examination.is_active == True,
        ).first()
        if not exam_obj:
            exam_obj = db.query(Examination).filter(Examination.is_active == True).first()
        if exam_obj:
            exam_id = exam_obj.id
        else:
            raise HTTPException(status_code=404, detail="Examination not found")

    subject_obj = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Fetch students for this class and session
    students_query = db.query(Student).filter(
        Student.class_id == class_id,
        Student.academic_session_id == session_id,
        Student.student_status == "ACTIVE",
    )
    # If subject has stream_id, filter students by stream
    if subject_obj.stream_id:
        students_query = students_query.filter(Student.stream_id == subject_obj.stream_id)

    students = students_query.order_by(Student.roll_number).all()

    # Fetch existing marks for this examination and subject
    existing_marks = db.query(Mark).filter(
        Mark.class_id == class_id,
        Mark.exam_id == exam_id,
        Mark.subject_id == subject_id,
        Mark.academic_session_id == session_id,
    ).all()
    marks_map = {m.student_id: m for m in existing_marks}

    student_rows = []
    for st in students:
        mark_record = marks_map.get(st.id)
        student_rows.append(MarkRowResponse(
            mark_id=mark_record.id if mark_record else None,
            student_id=st.id,
            roll_number=st.roll_number,
            scholar_number=st.scholar_number,
            student_name=st.student_name,
            maximum_marks=subject_obj.maximum_marks,
            obtained_marks=mark_record.obtained_marks if mark_record else None,
            remarks=mark_record.remarks if mark_record else None,
        ))

    return MarkGridResponse(
        academic_session_id=session_id,
        class_id=class_id,
        class_name=class_obj.class_name,
        exam_id=exam_id,
        exam_name=exam_obj.exam_name,
        subject_id=subject_id,
        subject_name=subject_obj.subject_name,
        maximum_marks=subject_obj.maximum_marks,
        passing_marks=subject_obj.passing_marks,
        students=student_rows,
    )


@router.post("/bulk")
def save_bulk_marks(
    payload: BulkMarksEntryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # 1. STRICT BACKEND AUTHORIZATION:
    # Teacher assigned to Class 5 attempting to update Class 6 -> 403 Forbidden!
    check_teacher_class_access(current_user, class_id=payload.class_id, is_write=True, db=db)

    subject_obj = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject_obj:
        raise HTTPException(status_code=404, detail="Subject not found")

    max_marks = subject_obj.maximum_marks
    saved_count = 0

    for item in payload.marks:
        # Validate student belongs to this class
        st = db.query(Student).filter(Student.id == item.student_id).first()
        if not st or st.class_id != payload.class_id:
            raise HTTPException(
                status_code=400,
                detail=f"Student ID {item.student_id} does not belong to Class ID {payload.class_id}",
            )

        # Validate marks range
        if item.obtained_marks < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Obtained marks cannot be negative for student {st.student_name}",
            )
        if item.obtained_marks > max_marks:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Obtained marks ({item.obtained_marks}) cannot exceed maximum marks ({max_marks}) for student {st.student_name}",
            )

        # Upsert mark record
        existing = db.query(Mark).filter(
            Mark.student_id == item.student_id,
            Mark.subject_id == payload.subject_id,
            Mark.exam_id == payload.exam_id,
            Mark.academic_session_id == payload.academic_session_id,
        ).first()

        if existing:
            old_val = str(existing.obtained_marks)
            existing.obtained_marks = item.obtained_marks
            existing.remarks = item.remarks
            existing.maximum_marks = max_marks
            db.commit()
            log_audit(
                db=db,
                action="MARKS_UPDATED",
                entity="Mark",
                entity_id=str(existing.id),
                old_value=old_val,
                new_value=str(item.obtained_marks),
                user_id=current_user.id,
                username=current_user.username,
            )
        else:
            new_mark = Mark(
                student_id=item.student_id,
                class_id=payload.class_id,
                subject_id=payload.subject_id,
                exam_id=payload.exam_id,
                academic_session_id=payload.academic_session_id,
                maximum_marks=max_marks,
                obtained_marks=item.obtained_marks,
                remarks=item.remarks,
            )
            db.add(new_mark)
            db.commit()
            db.refresh(new_mark)
            log_audit(
                db=db,
                action="MARKS_ENTERED",
                entity="Mark",
                entity_id=str(new_mark.id),
                new_value=str(item.obtained_marks),
                user_id=current_user.id,
                username=current_user.username,
            )
        saved_count += 1

    return {
        "message": f"Successfully processed {saved_count} marks records",
        "saved_count": saved_count,
    }
