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
    user = db.query(models.User).filter(models.User.id == barber.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != models.RoleEnum.barber:
        raise HTTPException(status_code=400, detail="This user does not have the 'barber' role")

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

    return schemas.BarberResponse(
        id=new_barber.id,
        user_id=new_barber.user_id,
        barber_name=user.name,   # we already have 'user' from the lookup above
        specialty=new_barber.specialty,
        bio=new_barber.bio,
        is_active=new_barber.is_active
    )


@router.get("/", response_model=list[schemas.BarberResponse])
def list_barbers(db: Session = Depends(get_db)):
    # Public endpoint - anyone (even logged-out customers) can see the barbers on the landing page
    barbers = db.query(models.Barber).filter(models.Barber.is_active == True).all()

    return [
        schemas.BarberResponse(
            id=barber.id,
            user_id=barber.user_id,
            barber_name=barber.user.name,
            specialty=barber.specialty,
            bio=barber.bio,
            is_active=barber.is_active
        )
        for barber in barbers
    ]

@router.get("/all", response_model=list[schemas.BarberResponse])
def get_all_barbers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    # Unlike GET /barbers/ (public, active-only, for the landing page),
    # this shows everyone including inactive barbers — the owner needs to
    # see them to be able to reactivate.
    barbers = db.query(models.Barber).all()

    return [
        schemas.BarberResponse(
            id=barber.id,
            user_id=barber.user_id,
            barber_name=barber.user.name,
            specialty=barber.specialty,
            bio=barber.bio,
            is_active=barber.is_active,
            phone=barber.user.phone
        )
        for barber in barbers
    ]


@router.patch("/{barber_id}/toggle-active", response_model=schemas.BarberResponse)
def toggle_barber_active(
    barber_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    barber = db.query(models.Barber).filter(models.Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    barber.is_active = not barber.is_active
    db.commit()
    db.refresh(barber)

    return schemas.BarberResponse(
        id=barber.id,
        user_id=barber.user_id,
        barber_name=barber.user.name,
        specialty=barber.specialty,
        bio=barber.bio,
        is_active=barber.is_active
    )


@router.patch("/{barber_id}", response_model=schemas.BarberResponse)
def update_barber(
    barber_id: int,
    data: schemas.BarberUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    barber = db.query(models.Barber).filter(models.Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    user = barber.user  # the linked User row, via the relationship

    # Only overwrite a field if the owner actually sent a new value for it
    if data.full_name is not None:
        user.name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.specialty is not None:
        barber.specialty = data.specialty
    if data.bio is not None:
        barber.bio = data.bio

    db.commit()
    db.refresh(barber)
    db.refresh(user)

    return schemas.BarberResponse(
        id=barber.id,
        user_id=barber.user_id,
        barber_name=user.name,
        specialty=barber.specialty,
        bio=barber.bio,
        is_active=barber.is_active,
        phone=user.phone
    )