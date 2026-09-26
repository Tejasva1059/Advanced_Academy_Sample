from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, Teacher, TeacherAssignment
from app.auth.security import decode_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def get_user_roles(user: User) -> List[str]:
    return [ur.role.name for ur in user.user_roles if ur.role]


def get_user_permissions(user: User) -> List[str]:
    permissions = set()
    for ur in user.user_roles:
        if ur.role:
            for rp in ur.role.role_permissions:
                if rp.permission:
                    permissions.add(rp.permission.name)
    return list(permissions)


def require_role(allowed_roles: List[str]):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        user_roles = get_user_roles(user)
        if "SUPER_ADMIN" in user_roles:
            return user
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}",
            )
        return user
    return role_checker


def check_teacher_class_access(
    user: User,
    class_id: int,
    is_write: bool,
    db: Session,
):
    """
    Strict backend authorization rule:
    - SUPER_ADMIN and PRINCIPAL can view & write all classes.
    - CLASS_TEACHER:
        * Write/Update marks: ONLY for their assigned class!
        * View results: If VIEW_ALL_RESULTS permission exists, can view any class.
                        Otherwise, can only view assigned class.
    """
    roles = get_user_roles(user)
    if "SUPER_ADMIN" in roles or "PRINCIPAL" in roles:
        return True

    permissions = get_user_permissions(user)

    # Find classes assigned to this user's teacher record
    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    assigned_class_ids = []
    if teacher:
        assignments = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.is_active == True,
        ).all()
        assigned_class_ids = [a.class_id for a in assignments]

    if is_write:
        if class_id not in assigned_class_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: You are only authorized to enter or modify marks for your assigned class(es).",
            )
        return True
    else:
        # Read/View access
        if "VIEW_ALL_RESULTS" in permissions:
            return True
        if class_id not in assigned_class_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: You are only authorized to view results for your assigned class(es).",
            )
        return True
