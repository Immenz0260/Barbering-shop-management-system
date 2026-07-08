from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth_utils import hash_password, verify_password, create_access_token, get_current_user, require_role

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
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user) # Refresh new_user with the id assigned by the database

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

@router.get("/owner-only-test")
def owner_only_route(current_user: models.User = Depends(require_role("owner"))):
    return{"message": f"Welcome, Owner {current_user.name}!😊"}