from typing import List, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import AuditLog, User
from app.schemas import AuditLogResponse
from app.auth.dependencies import require_role

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Any:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
