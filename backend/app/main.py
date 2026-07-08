from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models # this imports the matters - it registers all your table definitions with SQLAlchemy's Base
from .routers import users, barbers, services, bookings, dashboard
import os
from dotenv import load_dontenv

# Create all tables defined in models.py (only creates if they don't already exist)
Base.metadata.create_all(bind=engine)

load_dontenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")

app = FastAPI(
    title="Barbering Shop Management System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(barbers.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(dashboard.router)

@app.get("/")
def home():
    return{
        "message": "Barbering Shop Management System API is running"
    }
