from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import User, AuditLog, District
from backend.app.schemas.schemas import UserResponse, UserCreate, AuditLogResponse
from backend.app.utils.auth import hash_password, get_current_user, require_roles

router = APIRouter(prefix="/api/users", tags=["User and Role Management"])

@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("", response_model=UserResponse)
def create_new_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles(["State Administrator"]))
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email address already registered")

    new_user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        department=payload.department,
        district_id=payload.district_id,
        badge_id=payload.badge_id,
        phone=payload.phone,
        is_active=True
    )
    db.add(new_user)

    audit = AuditLog(
        user_id=admin.id,
        action="CREATE_USER",
        resource="UserManagement",
        details=f"Created user {new_user.full_name} with role {new_user.role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/{user_id}/status")
def toggle_user_status(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    return {"success": True, "user_id": user.id, "is_active": user.is_active}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    results = db.query(AuditLog, User.full_name.label("user_name"))\
                .outerjoin(User, AuditLog.user_id == User.id)\
                .order_by(AuditLog.created_at.desc())\
                .limit(limit)\
                .all()
    out = []
    for log, uname in results:
        res = AuditLogResponse.from_orm(log)
        res.user_name = uname or "System Daemon"
        out.append(res)
    return out

