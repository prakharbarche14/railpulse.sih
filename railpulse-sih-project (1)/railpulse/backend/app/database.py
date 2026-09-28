"""
Database configuration for RailPulse.

Defaults to SQLite for zero-config local/demo setup. Set DATABASE_URL in
.env to point at PostgreSQL for a production-style deployment, e.g.:

    DATABASE_URL=postgresql+psycopg2://railpulse:railpulse@localhost:5432/railpulse
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./railpulse.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
