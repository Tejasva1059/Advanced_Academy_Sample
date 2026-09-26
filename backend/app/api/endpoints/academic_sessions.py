from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import AcademicSession, User
from app.schemas import AcademicSessionResponse, AcademicSessionCreate
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit

router = APIRouter(prefix="/sessions", tags=["Academic Sessions"])


@router.get("", response_model=List[AcademicSessionResponse])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> Any:
    return db.query(AcademicSession).order_by(AcademicSession.session_name.desc()).all()


@router.post("", response_model=AcademicSessionResponse)
def create_session(
    payload: AcademicSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Any:
    if db.query(AcademicSession).filter(AcademicSession.session_name == payload.session_name).first():
        raise HTTPException(status_code=400, detail="Session name already exists")

    if payload.is_active:
        db.query(AcademicSession).update({"is_active": False})

    session = AcademicSession(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)

    log_audit(
        db=db,
        action="SESSION_CREATED",
        entity="AcademicSession",
        entity_id=str(session.id),
        new_value=session.session_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return session


@router.put("/{session_id}/activate", response_model=AcademicSessionResponse)
def activate_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Any:
    target = db.query(AcademicSession).filter(AcademicSession.id == session_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Session not found")

    db.query(AcademicSession).update({"is_active": False})
    target.is_active = True
    db.commit()
    db.refresh(target)

    log_audit(
        db=db,
        action="SESSION_ACTIVATED",
        entity="AcademicSession",
        entity_id=str(target.id),
        new_value=target.session_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return target
