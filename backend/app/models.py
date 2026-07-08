from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# Enum (fixed sets of allowed Values)

class RoleEnum(str, enum.Enum):
    customer = "customer"
    barber = "barber"
    owner = "owner"
    

class CustomerTypeEnum(str, enum.Enum):
    adult = "adult"
    child = "child"

class BookingStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"

class SourceEnum(str, enum.Enum):
    online = "online"
    walk_in = "walk_in"


#...............User Table.................
# Every person who logs in (customer, barber, or owner) is a User.
# The 'role' field is what determines what they're allowed to do in the system.

class User(Base):
     __tablename__ = "users"

     id = Column(Integer, primary_key=True, index=True)
     name = Column(String, nullable=False)
     email = Column(String, unique=True, index=True, nullable=False)
     password_hash = Column(String, nullable=False)
     phone = Column(String, nullable=True)
     role = Column(Enum(RoleEnum), nullable=False)
     created_at = Column(DateTime(timezone=True), server_default=func.now())

     # if this user is a barber, this links to their extra barber profile
     barber_profile = relationship("Barber", back_populates="user", uselist=False)

     # Bookings this user made as a customer
     bookings = relationship("Booking", back_populates="customer")


#...............Barber Table.................
# Extra info specific to barbers, linked 1-to-1 with a User (role="barber")

class Barber(Base):
    __tablename__ = "barbers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    specialty = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
   # rating = Column(Float, default=0.0)

    # Link back to the User table
    user = relationship("User", back_populates="barber_profile")

    # Bookings this barber has
    bookings = relationship("Booking", back_populates="barber")


#<<<<<<<<<<<<<<Service Table>>>>>>>>>>>>>
# The services the shop offers, with separate adult/child pricing. Bookings will reference these.

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    adult_price = Column(Float, nullable=False)
    child_price = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    description = Column(String, nullable=True)

    # Bookings that include this service
    bookings = relationship("Booking", back_populates="service")


#................Booking Table.................
# One row = one appointment, whether booked online or entered as a walk-in.

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # null for walk-ins with no account
    barber_id = Column(Integer, ForeignKey("barbers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)

    customer_name = Column(String, nullable=False)   # captured even for walk-ins
    customer_phone = Column(String, nullable=False)

    customer_type = Column(Enum(CustomerTypeEnum), nullable=False)
    price_charged = Column(Float, nullable=False)     # snapshot of price at booking time

    date = Column(String, nullable=False)      # we'll refine to a real Date type later
    time_slot = Column(String, nullable=False)

    status = Column(Enum(BookingStatusEnum), default=BookingStatusEnum.pending)
    cancellation_reason = Column(String, nullable=True)
    source = Column(Enum(SourceEnum), nullable=False)


    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", back_populates="bookings")
    barber = relationship("Barber", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")