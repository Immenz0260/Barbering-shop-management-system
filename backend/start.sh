#!/bin/sh

python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(bind=engine)"

alembic stamp head

uvicorn app.main:app --host 0.0.0.0 --port 8000