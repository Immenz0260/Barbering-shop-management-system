from datetime import date, timedelta
import random

from .database import SessionLocal, engine, Base
from . import models
from .auth_utils import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("Seeding demo data...")

# ---------- Staff: Owner + Barbers ----------

staff_data = [
    {"name": "Shop Owner", "email": "owner@shop.com", "phone": "0551115555", "role": models.RoleEnum.owner},
    {"name": "Kwame Mensah", "email": "kwame@shop.com", "phone": "0551112222", "role": models.RoleEnum.barber},
    {"name": "Ama Serwaa", "email": "ama@shop.com", "phone": "0551113333", "role": models.RoleEnum.barber},
    {"name": "Yaw Boateng", "email": "yaw@shop.com", "phone": "0551114444", "role": models.RoleEnum.barber},
]

created_staff = {}
for u in staff_data:
    existing = db.query(models.User).filter(models.User.email == u["email"]).first()
    if existing:
        created_staff[u["email"]] = existing
        continue
    new_user = models.User(
        name=u["name"], email=u["email"], phone=u["phone"], role=u["role"],
        password_hash=hash_password("password123")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    created_staff[u["email"]] = new_user

print(f"Staff ready: {len(created_staff)} (1 owner + 3 barbers)")

barber_profiles_data = [
    {"email": "kwame@shop.com", "specialty": "Fades and Line-ups", "bio": "5 years experience specializing in modern fades"},
    {"email": "ama@shop.com", "specialty": "Kids Cuts and Classic Styles", "bio": "Gentle, patient, great with children"},
    {"email": "yaw@shop.com", "specialty": "Beard Grooming", "bio": "Beard sculpting and traditional shaves"},
]

created_barbers = []
for b in barber_profiles_data:
    user = created_staff[b["email"]]
    existing = db.query(models.Barber).filter(models.Barber.user_id == user.id).first()
    if existing:
        created_barbers.append(existing)
        continue
    new_barber = models.Barber(user_id=user.id, specialty=b["specialty"], bio=b["bio"])
    db.add(new_barber)
    db.commit()
    db.refresh(new_barber)
    created_barbers.append(new_barber)

print(f"Barber profiles ready: {len(created_barbers)}")

# ---------- Services ----------

services_data = [
    {"name": "Haircut", "adult_price": 30, "child_price": 20, "duration_minutes": 30, "description": "Classic haircut and shape-up"},
    {"name": "Beard Trim", "adult_price": 15, "child_price": 15, "duration_minutes": 15, "description": "Beard shaping and grooming"},
    {"name": "Haircut + Beard Combo", "adult_price": 40, "child_price": 30, "duration_minutes": 45, "description": "Full haircut and beard grooming package"},
    {"name": "Kids Cut", "adult_price": 20, "child_price": 20, "duration_minutes": 20, "description": "Haircut tailored for children"},
]

created_services = []
for s in services_data:
    existing = db.query(models.Service).filter(models.Service.name == s["name"]).first()
    if existing:
        created_services.append(existing)
        continue
    new_service = models.Service(**s)
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    created_services.append(new_service)

print(f"Services ready: {len(created_services)}")

# ---------- Generate 62 customer identities ----------

FIRST_NAMES = [
    "Kofi", "Ama", "Kwabena", "Akosua", "Kwame", "Efua", "Yaw", "Abena",
    "Kwaku", "Adjoa", "Kojo", "Afia", "John", "Grace", "David", "Mary",
    "Michael", "Sarah", "Daniel", "Comfort", "Samuel", "Gifty", "Emmanuel", "Vivian",
    "Isaac", "Patience", "Prince", "Rita", "Eric", "Linda", "Nana"
]
LAST_NAMES = [
    "Mensah", "Owusu", "Boateng", "Asante", "Addo", "Appiah", "Osei", "Gyasi",
    "Amankwah", "Adjei", "Frimpong", "Darko", "Antwi", "Sarpong", "Acheampong", "Ofori"
]

def generate_unique_names(count):
    names = set()
    while len(names) < count:
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        names.add(name)
    return list(names)

all_names = generate_unique_names(62)

def make_phone(index):
    return f"024{1000000 + index}"  # generates unique-looking phone numbers

# Group A: 31 registered customers who book ONLINE
online_customers = []
for i in range(31):
    name = all_names[i]
    email = f"customer{i+1}@example.com"
    phone = make_phone(i)
    existing = db.query(models.User).filter(models.User.email == email).first()
    if not existing:
        existing = models.User(
            name=name, email=email, phone=phone, role=models.RoleEnum.customer,
            password_hash=hash_password("password123")
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
    online_customers.append(existing)

# Group B1: 16 registered customers who happen to book via WALK-IN
walkin_registered_customers = []
for i in range(31, 47):
    name = all_names[i]
    email = f"customer{i+1}@example.com"
    phone = make_phone(i)
    existing = db.query(models.User).filter(models.User.email == email).first()
    if not existing:
        existing = models.User(
            name=name, email=email, phone=phone, role=models.RoleEnum.customer,
            password_hash=hash_password("password123")
        )
        db.add(existing)
        db.commit()
        db.refresh(existing)
    walkin_registered_customers.append(existing)

# Group B2: 15 UNREGISTERED customers — walk-in only, no User account
walkin_unregistered_customers = []
for i in range(47, 62):
    name = all_names[i]
    phone = make_phone(i)
    walkin_unregistered_customers.append({"name": name, "phone": phone})

print(f"Customer identities ready: {len(online_customers)} online-registered, "
      f"{len(walkin_registered_customers)} walkin-registered, "
      f"{len(walkin_unregistered_customers)} walkin-unregistered "
      f"(total {len(online_customers) + len(walkin_registered_customers) + len(walkin_unregistered_customers)})")

# ---------- Generate 228 bookings, spread April 1 -> today ----------

today = date.today()
start_date = date(2026, 4, 1)
days_span = (today - start_date).days

statuses = [
    models.BookingStatusEnum.pending,
    models.BookingStatusEnum.confirmed,
    models.BookingStatusEnum.completed,
    models.BookingStatusEnum.completed,  # weighted slightly toward completed for realistic revenue
    models.BookingStatusEnum.cancelled,
]

time_slots = ["9:00 AM", "10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"]

booking_count = 0
for _ in range(228):
    group_choice = random.choice(["online", "walkin_registered", "walkin_unregistered"])

    if group_choice == "online":
        customer = random.choice(online_customers)
        customer_id = customer.id
        customer_name = customer.name
        customer_phone = customer.phone
        source = models.SourceEnum.online

    elif group_choice == "walkin_registered":
        customer = random.choice(walkin_registered_customers)
        customer_id = customer.id
        customer_name = customer.name
        customer_phone = customer.phone
        source = models.SourceEnum.walk_in

    else:
        customer = random.choice(walkin_unregistered_customers)
        customer_id = None
        customer_name = customer["name"]
        customer_phone = customer["phone"]
        source = models.SourceEnum.walk_in

    barber = random.choice(created_barbers)
    service = random.choice(created_services)
    customer_type = random.choice([models.CustomerTypeEnum.adult, models.CustomerTypeEnum.child])
    status = random.choice(statuses)
    booking_date = start_date + timedelta(days=random.randint(0, days_span))
    price = service.adult_price if customer_type == models.CustomerTypeEnum.adult else service.child_price

    booking = models.Booking(
        customer_id=customer_id,
        barber_id=barber.id,
        service_id=service.id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_type=customer_type,
        price_charged=price,
        date=booking_date.isoformat(),
        time_slot=random.choice(time_slots),
        status=status,
        source=source,
        cancellation_reason="Customer requested cancellation" if status == models.BookingStatusEnum.cancelled else None
    )
    db.add(booking)
    booking_count += 1

db.commit()
print(f"Created {booking_count} bookings spanning {start_date} to {today}")

db.close()
print("Seeding complete!")