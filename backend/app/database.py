from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()


# Database connection string
DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine (connection to PostgreSQL)
engine = create_engine(DATABASE_URL)

# Create session factory (used for queries)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for models (tables)
Base = declarative_base()

# Dependency: gives DB session to FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()