from pydantic import BaseModel, EmailStr
from typing import Optional
from .models import RoleEnum, CustomerTypeEnum, BookingStatusEnum, SourceEnum
from datetime import datetime

#................User Schemas.................

# What the client sends when signing up as a new user (customer, barber, or owner)
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
#   role: RoleEnum = RoleEnum.customer (role is removed — public users cannot choose) # default role is customer if not specified

# What the cient sends when logging in
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# What the API sends back (never includes password_hash)
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: RoleEnum

class Config:
    from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" # default value for token_type is "bearer"



#................Barber Schemas..............

class BarberCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    bio: Optional[str] = None

class BarberResponse(BaseModel):
    id: int
    user_id: int
    barber_name: str
    specialty: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True



#..................... Service Schemas ..................

class ServiceCreate(BaseModel):
    name: str
    adult_price: float
    child_price: float
    duration_minutes: int
    description: Optional[str] = None
    available_for_adult: bool = True
    available_for_child: bool = True

class ServiceResponse(BaseModel):
    id: int
    name: str
    adult_price: float
    child_price: float
    duration_minutes: int
    description: Optional[str] = None
    available_for_adult: bool
    available_for_child: bool

    class Config:
        from_attributes = True



#................. Booking Schemas.................

class BookingCreate(BaseModel):
    barber_id: int
    service_id: int
    customer_type: CustomerTypeEnum
    date: str  #e.g "2026-07-10" - we'll refine to a real date type later
    time_slot: str # e.g. "10:00 AM"

class BookingResponse(BaseModel):
    id: int
    customer_id: Optional[int] = None
    barber_id: int
    service_id: int
    customer_name: str
    customer_phone: str
    customer_type: CustomerTypeEnum
    price_charged: float
    date: str
    time_slot: str
    status: BookingStatusEnum
    source: SourceEnum
    created_at: datetime

    class Config:
        from_attributes = True



#....................WalkingIn..............

class WalkInCreate(BaseModel):
    barber_id: int
    service_id: int
    customer_name: str
    customer_phone: str
    customer_type: CustomerTypeEnum
    date: str
    time_slot: str


class BookingsStatusUpdate(BaseModel):
    status: BookingStatusEnum
    cancellation_reason: Optional[str] = None


# ....... Dashboard Schemas .........

class DashboardSummary(BaseModel):
    total_revenue: float
    total_bookings: int
    pending_count: int
    confirmed_count: int
    completed_count: int
    cancelled_count: int
    online_count: int
    walk_in_count: int


class BarberStats(BaseModel):
    barber_id: int
    barber_name: str
    total_bookings: int
    total_revenue: float

class BarberStatsResponse(BaseModel):
    barbers: list[BarberStats]


class PopularService(BaseModel):
    service_id: int
    service_name: str
    times_booked: int
    total_revenue: float

class PopularServicesResponse(BaseModel):
    services: list[PopularService]


class CustomerStats(BaseModel):
    total_unique_customers: int
    new_customers: int
    returning_customers: int


class CustomerDetail(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None   # None for walk-in-only customers with no account
    total_visits: int
    total_spent: float

class CustomerListResponse(BaseModel):
    customers: list[CustomerDetail]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str