from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from sqlalchemy import func, case

from ..database import get_db
from .. import models, schemas
from ..auth_utils import require_role


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)



def apply_date_filter(query, start_date: Optional[str], end_date: Optional[str]):
    """Resuable helper - applies an optional date range filter to any booking query."""
    if start_date:
        query = query.filter(models.Booking.date >= start_date)
    if end_date:
        query = query.filter(models.Booking.date <= end_date)
    return query


@router.get("/summary", response_model=schemas.DashboardSummary)
def get_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] =  Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    base_query = apply_date_filter(db.query(models.Booking), start_date, end_date)

    total_bookings = base_query.count()

    # Only count revenue from completed bookings — pending/cancelled haven't actually been paid
    total_revenue = apply_date_filter(
        db.query(func.sum(models.Booking.price_charged)).filter(
            models.Booking.status == models.BookingStatusEnum.completed
        ),
        start_date, end_date
    ).scalar() or 0.0

    pending_count = apply_date_filter(
        db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.pending),
        start_date, end_date
    ).count()

    confirmed_count = apply_date_filter(
        db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.confirmed),
        start_date, end_date
    ).count()

    completed_count = apply_date_filter(
        db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.completed),
        start_date, end_date
    ).count()

    cancelled_count = apply_date_filter(
        db.query(models.Booking).filter(models.Booking.status == models.BookingStatusEnum.cancelled),
        start_date, end_date
    ).count()

    online_count = apply_date_filter(
        db.query(models.Booking).filter(models.Booking.source == models.SourceEnum.online),
        start_date, end_date
    ).count()

    walk_in_count = apply_date_filter(
        db.query(models.Booking).filter(models.Booking.source == models.SourceEnum.walk_in),
        start_date, end_date
    ).count()

    return schemas.DashboardSummary(
        total_revenue=total_revenue,
        total_bookings=total_bookings,
        pending_count=pending_count,
        confirmed_count=confirmed_count,
        completed_count=completed_count,
        cancelled_count=cancelled_count,
        online_count=online_count,
        walk_in_count=walk_in_count
    )



@router.get("/by-barber", response_model=schemas.BarberStatsResponse)
def get_barber_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    barbers = db.query(models.Barber).all()

    results = []
    for barber in barbers:
        booking_query = apply_date_filter(
            db.query(models.Booking).filter(models.Booking.barber_id ==barber.id),
            start_date, end_date
        )

        total_bookings = booking_query.count()
        total_revenue = apply_date_filter(
            db.query(func.sum(models.Booking.price_charged)).filter(
                models.Booking.barber_id == barber.id,
                models.Booking.status == models.BookingStatusEnum.completed
            ),
            start_date, end_date
        ).scalar() or 0.0


        results.append(schemas.BarberStats(
            barber_id=barber.id,
            barber_name=barber.user.name,
            total_bookings=total_bookings,
            total_revenue=total_revenue
        ))

    return schemas.BarberStatsResponse(barbers=results)



@router.get("/popular-services", response_model=schemas.PopularServicesResponse)
def get_popular_services(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    query = db.query(
        models.Service.id,
        models.Service.name,
        func.count(models.Booking.id).label("times_booked"),
        func.coalesce(
            func.sum(
                case(
                    (models.Booking.status == models.BookingStatusEnum.completed, models.Booking.price_charged),
                    else_=0
                )
            ), 0.0
        ).label("total_revenue")
    ).join(
        models.Booking, models.Booking.service_id == models.Service.id, isouter=True
    )

    if start_date:
        query = query.filter(models.Booking.date >= start_date)
    if end_date:
        query = query.filter(models.Booking.date <= end_date)

    query = query.group_by(models.Service.id, models.Service.name).order_by(func.count(models.Booking.id).desc())

    rows = query.all()

    services = [
        schemas.PopularService(
            service_id=row.id,
            service_name=row.name,
            times_booked=row.times_booked,
            total_revenue=row.total_revenue
        )
        for row in rows
    ]

    return schemas.PopularServicesResponse(services=services)



@router.get("/customers", response_model=schemas.CustomerStats)
def get_customer_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    # Only count completed bookings — this reflects actual repeat business
    query = db.query(
        models.Booking.customer_phone,
        func.count(models.Booking.id).label("completed_count")
    ).filter(
        models.Booking.status == models.BookingStatusEnum.completed
    )

    if start_date:
        query = query.filter(models.Booking.date >= start_date)
    if end_date:
        query = query.filter(models.Booking.date <= end_date)

    query = query.group_by(models.Booking.customer_phone)

    rows = query.all()

    total_unique_customers = len(rows)
    new_customers = sum(1 for row in rows if row.completed_count == 1)
    returning_customers = sum(1 for row in rows if row.completed_count >= 2)

    return schemas.CustomerStats(
        total_unique_customers=total_unique_customers,
        new_customers=new_customers,
        returning_customers=returning_customers
    )


@router.get("/customers-list", response_model=schemas.CustomerListResponse)
def get_customers_list(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role("owner"))
):
    query = db.query(
        models.Booking.customer_phone,
        models.Booking.customer_name,
        func.count(models.Booking.id).label("total_visits"),
        func.coalesce(
            func.sum(
                case(
                    (models.Booking.status == models.BookingStatusEnum.completed, models.Booking.price_charged),
                    else_=0
                )
            ), 0.0
        ).label("total_spent")
    ).filter(
        models.Booking.status == models.BookingStatusEnum.completed
    )

    if search:
        query = query.filter(
            (models.Booking.customer_name.ilike(f"%{search}%")) |
            (models.Booking.customer_phone.ilike(f"%{search}%"))
        )

    query = query.group_by(models.Booking.customer_phone, models.Booking.customer_name)

    rows = query.all()

    customers = []
    for row in rows:
        # Check if this phone number belongs to a registered account, to fetch their email
        matched_user = db.query(models.User).filter(
            models.User.phone == row.customer_phone,
            models.User.role == models.RoleEnum.customer
        ).first()

        customers.append(schemas.CustomerDetail(
            name=row.customer_name,
            phone=row.customer_phone,
            email=matched_user.email if matched_user else None,
            total_visits=row.total_visits,
            total_spent=row.total_spent
        ))

    return schemas.CustomerListResponse(customers=customers)