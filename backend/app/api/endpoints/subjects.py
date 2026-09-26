from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Subject, ClassEntity, StreamEntity, User
from app.schemas import SubjectResponse, SubjectCreate, SubjectUpdate
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    class_id: Optional[int] = Query(None),
    stream_id: Optional[int] = Query(None),
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = db.query(Subject).filter(Subject.is_active == True)
    if class_id:
        query = query.filter(Subject.class_id == class_id)
    if stream_id:
        query = query.filter((Subject.stream_id == stream_id) | (Subject.stream_id.is_(None)))
    if session_id:
        query = query.filter(Subject.academic_session_id == session_id)

    subjects = query.order_by(Subject.class_id, Subject.id).all()
    results = []
    for s in subjects:
        results.append(SubjectResponse(
            id=s.id,
            subject_code=s.subject_code,
            subject_name=s.subject_name,
            short_name=s.short_name,
            class_id=s.class_id,
            stream_id=s.stream_id,
            academic_session_id=s.academic_session_id,
            subject_type=s.subject_type,
            maximum_marks=s.maximum_marks,
            passing_marks=s.passing_marks,
            is_active=s.is_active,
            class_name=s.class_entity.class_name if s.class_entity else None,
            stream_name=s.stream_entity.stream_name if s.stream_entity else None,
        ))
    return results


@router.post("", response_model=SubjectResponse)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    sub = Subject(**payload.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)

    log_audit(
        db=db,
        action="SUBJECT_CREATED",
        entity="Subject",
        entity_id=str(sub.id),
        new_value=sub.subject_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return SubjectResponse(
        id=sub.id,
        **payload.model_dump(),
        class_name=sub.class_entity.class_name if sub.class_entity else None,
        stream_name=sub.stream_entity.stream_name if sub.stream_entity else None,
    )


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    old_name = sub.subject_name
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(sub, key, value)

    db.commit()
    db.refresh(sub)

    log_audit(
        db=db,
        action="SUBJECT_UPDATED",
        entity="Subject",
        entity_id=str(sub.id),
        old_value=old_name,
        new_value=sub.subject_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return SubjectResponse(
        id=sub.id,
        subject_code=sub.subject_code,
        subject_name=sub.subject_name,
        short_name=sub.short_name,
        class_id=sub.class_id,
        stream_id=sub.stream_id,
        academic_session_id=sub.academic_session_id,
        subject_type=sub.subject_type,
        maximum_marks=sub.maximum_marks,
        passing_marks=sub.passing_marks,
        is_active=sub.is_active,
        class_name=sub.class_entity.class_name if sub.class_entity else None,
        stream_name=sub.stream_entity.stream_name if sub.stream_entity else None,
    )
