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
        description=service.description
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)

    return new_service


@router.get("/", response_model=list[schemas.ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    # Public - anyone browsing the landing/booking page can see services and prices
    return db.query(models.Service).all()


@router.put("/{service_id}", response_model=schemas.ServiceResponse)
def update_service(
    service_id: int,
    service: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    existing_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    existing_service.name = service.name
    existing_service.adult_price = service.adult_price
    existing_service.child_price = service.child_price
    existing_service.duration_minutes = service.duration_minutes
    existing_service.description = service.description

    db.comit()
    db.refresh(existing_service)

    return existing_service

@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    existing_service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db.delete(existing_service)
    db.commit()

    return {"message": f"Service '{existing_service.name}' deleted successfully"}
