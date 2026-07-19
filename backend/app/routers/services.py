from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..auth_utils import require_role


router = APIRouter(
    prefix="/services",
    tags=["Services"]
)

@router.post("/", response_model=schemas.ServiceResponse)
def create_service(
    service: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    new_service = models.Service(
        name=service.name,
        adult_price=service.adult_price,
        child_price=service.child_price,
        duration_minutes=service.duration_minutes,
        description=service.description,
        available_for_adult=service.available_for_adult,
        available_for_child=service.available_for_child,
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


@router.get("/", response_model=list[schemas.ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    # Public — active services only, for the landing/booking pages
    return db.query(models.Service).filter(models.Service.is_active == True).all()


@router.get("/all", response_model=list[schemas.ServiceResponse])
def get_all_services(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    # Owner-only — includes inactive services too, so they can be reactivated
    return db.query(models.Service).all()


@router.patch("/{service_id}", response_model=schemas.ServiceResponse)
def update_service(
    service_id: int,
    data: schemas.ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Only overwrite a field if the owner actually sent a new value for it
    if data.name is not None:
        service.name = data.name
    if data.adult_price is not None:
        service.adult_price = data.adult_price
    if data.child_price is not None:
        service.child_price = data.child_price
    if data.duration_minutes is not None:
        service.duration_minutes = data.duration_minutes
    if data.description is not None:
        service.description = data.description
    if data.available_for_adult is not None:
        service.available_for_adult = data.available_for_adult
    if data.available_for_child is not None:
        service.available_for_child = data.available_for_child

    db.commit()
    db.refresh(service)
    return service


@router.patch("/{service_id}/toggle-active", response_model=schemas.ServiceResponse)
def toggle_service_active(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.is_active = not service.is_active
    db.commit()
    db.refresh(service)
    return service