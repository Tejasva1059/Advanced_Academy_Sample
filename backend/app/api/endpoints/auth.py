from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, Teacher, TeacherAssignment
from app.schemas import LoginRequest, Token, UserResponse
from app.auth.security import verify_password, create_access_token
from app.auth.dependencies import get_current_user, get_user_roles, get_user_permissions

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(
        (User.username == request.username) | (User.email == request.username)
    ).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated",
        )

    roles = get_user_roles(user)
    permissions = get_user_permissions(user)

    teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
    teacher_id = teacher.id if teacher else None
    assigned_class_ids = []
    if teacher:
        assignments = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.is_active == True,
        ).all()
        assigned_class_ids = [a.class_id for a in assignments]

    access_token = create_access_token(data={"sub": user.username, "user_id": user.id})

    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "roles": roles,
        "permissions": permissions,
        "teacher_id": teacher_id,
        "assigned_class_ids": assigned_class_ids,
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Any:
    roles = get_user_roles(current_user)
    permissions = get_user_permissions(current_user)

    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    teacher_id = teacher.id if teacher else None
    assigned_class_ids = []
    if teacher:
        assignments = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.is_active == True,
        ).all()
        assigned_class_ids = [a.class_id for a in assignments]

    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        roles=roles,
        permissions=permissions,
        teacher_id=teacher_id,
        assigned_class_ids=assigned_class_ids,
    )
