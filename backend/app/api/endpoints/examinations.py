from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Examination, AcademicSession, User
from app.schemas import ExaminationResponse, ExaminationCreate
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit

router = APIRouter(prefix="/examinations", tags=["Examinations"])


@router.get("", response_model=List[ExaminationResponse])
def get_examinations(
    session_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = db.query(Examination).filter(Examination.is_active == True)
    if session_id:
        query = query.filter(Examination.academic_session_id == session_id)

    exams = query.order_by(Examination.id).all()
    results = []
    for ex in exams:
        results.append(ExaminationResponse(
            id=ex.id,
            exam_name=ex.exam_name,
            exam_type=ex.exam_type,
            academic_session_id=ex.academic_session_id,
            start_date=ex.start_date,
            end_date=ex.end_date,
            status=ex.status,
            is_active=ex.is_active,
            session_name=ex.academic_session.session_name if ex.academic_session else None,
        ))
    return results


@router.post("", response_model=ExaminationResponse)
def create_examination(
    payload: ExaminationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN", "PRINCIPAL"])),
) -> Any:
    ex = Examination(**payload.model_dump())
    db.add(ex)
    db.commit()
    db.refresh(ex)

    log_audit(
        db=db,
        action="EXAMINATION_CREATED",
        entity="Examination",
        entity_id=str(ex.id),
        new_value=ex.exam_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return ExaminationResponse(
        id=ex.id,
        **payload.model_dump(),
        session_name=ex.academic_session.session_name if ex.academic_session else None,
    )
