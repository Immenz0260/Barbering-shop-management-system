from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth_utils import require_role

router = APIRouter(
    prefix="/barbers",
    tags=["Barbers"]
)

@router.post("/", response_model=schemas.BarberResponse)
def create_barber_profile(
    barber: schemas.BarberCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    # Confirm the target user actually exists and hs role 'barber'
    user = db.query(models.User).filter(models.User.id == barber.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != models.RoleEnum.barber:
        raise HTTPException(status_code=400, detail="This user does not have the 'barber' role")
    
    # Prevent creating a duplicate profile for the same user
    existing = db.query(models.Barber).filter(models.Barber.user_id == barber.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="This user already has a barber profile")
    
    new_barber = models.Barber(
        user_id=barber.user_id,
        specialty=barber.specialty,
        bio=barber.bio
    )

    db.add(new_barber)
    db.commit()
    db.refresh(new_barber)

    return new_barber


@router.get("/", response_model=list[schemas.BarberResponse])
def list_barbers(db: Session = Depends(get_db)):
    # Public endpoint - anyone (even logged-out coustomers) can see the barber on the landing page
    return db.query(models.Barber).filter(models.Barber.is_active == True).all()