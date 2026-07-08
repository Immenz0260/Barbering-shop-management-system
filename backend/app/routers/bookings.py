from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from .. import models, schemas
from ..auth_utils import get_current_user, require_role


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post("/", response_model=schemas.BookingResponse)
def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("customer"))
):
    # Confirm the barber exists and is active
    barber = db.query(models.Barber).filter(
        models.Barber.id == booking.barber_id,
        models.Barber.is_active == True
    ).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found or not active")
    
    # Confirm the service exists
    service = db.query(models.Service).filter(models.Service.id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Pick the correct price based on customer_type - this is the snapshot moment
    if booking.customer_type == models.CustomerTypeEnum.adult:
        price = service.adult_price
    else:
        price = service.child_price

    
    new_booking = models.Booking(
        customer_id=current_user.id,
        barber_id=booking.barber_id,
        service_id=booking.service_id,
        customer_name=current_user.name,
        customer_phone=current_user.phone,
        customer_type=booking.customer_type,
        price_charged=price,
        date=booking.date,
        time_slot=booking.time_slot,
        status=models.BookingStatusEnum.pending,
        source=models.SourceEnum.online
    )


    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)


    return new_booking


@router.post("/walk-in", response_model=schemas.BookingResponse)
def create_walk_in(
    walk_in: schemas.WalkInCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("barber", "owner"))
):
    matched_user = db.query(models.User).filter(
        models.User.phone == walk_in.customer_phone,
        models.User.role == models.RoleEnum.customer
    ).first()

    barber = db.query(models.Barber).filter(
        models.Barber.id == walk_in.barber_id,
        models.Barber.is_active == True
    ).first()
    if not barber:
        raise HTTPException(status_code=404, dtail="Barber not found or not active")
    
    service = db.query(models.Service).filter(models.Service.id == walk_in.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Barber not found or not active")
    
    if walk_in.customer_type == models.CustomerTypeEnum.adult:
        price = service.adult_price
    else:
        price = service.child_price
    
    new_booking = models.Booking(
        customer_id= matched_user.id if matched_user else None, # walk-ins may not have an account
        barber_id=walk_in.barber_id,
        service_id=walk_in.service_id,
        customer_name=walk_in.customer_name,
        customer_phone=walk_in.customer_phone,
        customer_type=walk_in.customer_type,
        price_charged=price,
        date=walk_in.date,
        time_slot=walk_in.time_slot,
        status=models.BookingStatusEnum.completed,  # walk-ins are typically recorded after service, not "pending"
        source=models.SourceEnum.walk_in
    )


    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)


    return new_booking



@router.get("/", response_model=list[schemas.BookingResponse])
def list_bookings(
    status: Optional[models.BookingStatusEnum] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Booking)

    if current_user.role == models.RoleEnum.owner:
        # Owner sees everything - no filter applied 

        pass

    elif current_user.role == models.RoleEnum.barber:
        # Find this barber's own Barber profile, then filter by its id
        barber_profile = db.query(models.Barber).filter(
            models.Barber.user_id == current_user.id
        ).first()

    
        if not barber_profile:
            raise HTTPException(status_code=404, detail="Barber profile not found for this account")
        
        query = query.filter(models.Booking.barber_id == barber_profile.id)


    else: # Customer
        query = query.filter(models.Booking.customer_id == current_user.id)
    
    if status:
        query = query.filter(models.Booking.status == status)

    return query.all()



@router.patch("/{booking_id}/status", response_model=schemas.BookingResponse)
def update_booking_status(
    booking_id: int,
    update: schemas.BookingsStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    

    #........ Role-base permission Checks .......

    if current_user.role == models.RoleEnum.customer:
        if booking.customer_id != current_user.id: 
            raise HTTPException(status_code=403, detail="You can oly modify your own bookings")
        if update.status != models.BookingStatusEnum.cancelled:
            raise HTTPException(status_code=403, detail="Customers can only cancel bookings")
        
    elif current_user.role == models.RoleEnum.barber:
        barber_profile = db.query(models.Barber).filter(
            models.Barber.user_id == current_user.id
        ).first()
        if not barber_profile or booking.barber_id != barber_profile.id:
            raise HTTPException(status_code=403, detail="You can only modify your own bookings")
        
    # Owners can update any booking - no extra check needed

    # ---- Cancellation reason rule applies to Every role ----
    if update.status == models.BookingStatusEnum.cancelled:
        if not update.cancellation_reason or not update.cancellation_reason.strip():
            raise HTTPException(status_code=400, detail="A cancellation reason is required")

    booking.status = update.status
    if update.status == models.BookingStatusEnum.cancelled:
        booking.cancellation_reason = update.cancellation_reason
    else:
        booking.cancellation_reason = None

    db.commit()
    db.refresh(booking)


    return booking        


