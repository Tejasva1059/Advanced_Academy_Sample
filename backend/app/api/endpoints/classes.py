from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models import ClassEntity, Student, Subject, TeacherAssignment, User
from app.schemas import ClassResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.get("", response_model=List[ClassResponse])
def get_classes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    classes = db.query(ClassEntity).order_by(ClassEntity.numeric_order).all()

    # Calculate student count per class
    counts = dict(
        db.query(Student.class_id, func.count(Student.id))
        .filter(Student.student_status == "ACTIVE")
        .group_by(Student.class_id)
        .all()
    )

    results = []
    for c in classes:
        results.append(ClassResponse(
            id=c.id,
            class_name=c.class_name,
            numeric_order=c.numeric_order,
            description=c.description,
            is_active=c.is_active,
            student_count=counts.get(c.id, 0),
        ))
    return results


@router.get("/{class_id}")
def get_class_details(class_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    c = db.query(ClassEntity).filter(ClassEntity.id == class_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Class not found")

    subjects = db.query(Subject).filter(Subject.class_id == class_id, Subject.is_active == True).all()
    assignments = db.query(TeacherAssignment).filter(TeacherAssignment.class_id == class_id, TeacherAssignment.is_active == True).all()

    return {
        "id": c.id,
        "class_name": c.class_name,
        "numeric_order": c.numeric_order,
        "description": c.description,
        "subjects": [{"id": s.id, "name": s.subject_name, "code": s.subject_code, "max_marks": s.maximum_marks} for s in subjects],
        "teachers": [{"id": a.teacher_id, "name": a.teacher.full_name, "role": a.assignment_type} for a in assignments if a.teacher],
    }
