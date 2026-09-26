import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models import AuditLog


def log_audit(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    def serialize(val):
        if val is None:
            return None
        if isinstance(val, (str, int, float, bool)):
            return str(val)
        try:
            return json.dumps(val)
        except Exception:
            return str(val)

    log_entry = AuditLog(
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id is not None else None,
        old_value=serialize(old_value),
        new_value=serialize(new_value),
        user_id=user_id,
        username=username,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
