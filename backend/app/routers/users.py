from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import hash_password, verify_password, create_access_token, get_current_user, require_role
from datetime import datetime, timedelta
import secrets
from ..email_utils import send_reset_email
from ..email_utils import send_signup_confirmation_email

reset_tokens = {}

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/signup", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user with this email is already registered
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password before storing it 
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        phone=user.phone,
        role=models.RoleEnum.customer #user.role( Always customer, ignore anything from the frontend)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user) # Refresh new_user with the id assigned by the database

    send_signup_confirmation_email(new_user.email, new_user.name)

    return new_user

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Endode id and role into the token - this is what the future requests will trust
    access_token = create_access_token(data={"user_id": user.id, "role": user.role.value})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

# ====================== OWNER-ONLY ENDPOINTS ======================

@router.post("/staff/create-barber", response_model=schemas.UserResponse)
def create_barber_account(
    data: schemas.BarberCreate,                    # We'll create this schema next
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the User with barber role
    new_user = models.User(
        name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        phone=data.phone,
        role=models.RoleEnum.barber
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create the associated Barber profile
    new_barber = models.Barber(
        user_id=new_user.id,
        specialty=data.specialty,
        bio=data.bio or ""
    )
    db.add(new_barber)
    db.commit()

    return new_user

@router.get("/owner-only-test")
def owner_only_route(current_user: models.User = Depends(require_role("owner"))):
    return{"message": f"Welcome, Owner {current_user.name}!😊"}


@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user:
        # We still return success even if email not found (security best practice)
        return {"message": "If your email is registered, you will receive a reset link."}

    # Generate reset token
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)

    reset_tokens[token] = {
        "email": user.email,
        "expires": expires
    }

    send_reset_email(user.email, token)

    return {"message": "If your email is registered, you will receive a reset link."}



@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    token_data = reset_tokens.get(request.token)

    if not token_data or token_data["expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(models.User).filter(models.User.email == token_data["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(request.new_password)
    db.commit()

    # Remove used token
    del reset_tokens[request.token]

    return {"message": "Password reset successful. You can now log in with your new password."}