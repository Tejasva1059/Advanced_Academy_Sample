from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, Role, UserRole
from app.schemas import UserResponse
from app.auth.dependencies import require_role, get_user_roles, get_user_permissions

router = APIRouter(prefix="/users", tags=["Users & Roles"])


@router.get("", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["SUPER_ADMIN"])),
) -> Any:
    users = db.query(User).all()
    results = []
    for u in users:
        results.append(UserResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active,
            roles=get_user_roles(u),
            permissions=get_user_permissions(u),
            teacher_id=u.teacher.id if u.teacher else None,
            assigned_class_ids=[],
        ))
    return results
