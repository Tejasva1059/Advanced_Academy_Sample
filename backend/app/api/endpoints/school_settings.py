from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import SchoolSetting, User
from app.schemas import SchoolSettingResponse, SchoolSettingUpdate
from app.auth.dependencies import get_current_user, require_role
from app.services.audit_service import log_audit

router = APIRouter(prefix="/settings", tags=["School Settings"])


@router.get("", response_model=SchoolSettingResponse)
def get_school_settings(db: Session = Depends(get_db)) -> Any:
    setting = db.query(SchoolSetting).first()
    if not setting:
        setting = SchoolSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.put("", response_model=SchoolSettingResponse)
def update_school_settings(
    payload: SchoolSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Any:
    setting = db.query(SchoolSetting).first()
    if not setting:
        setting = SchoolSetting()
        db.add(setting)

    old_vals = setting.school_name
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(setting, key, value)

    db.commit()
    db.refresh(setting)

    log_audit(
        db=db,
        action="SETTINGS_UPDATED",
        entity="SchoolSetting",
        entity_id=str(setting.id),
        old_value=old_vals,
        new_value=setting.school_name,
        user_id=current_user.id,
        username=current_user.username,
    )

    return setting
