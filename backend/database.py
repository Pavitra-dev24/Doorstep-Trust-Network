"""
Database setup.

Defaults to a local SQLite file so the project runs with zero configuration.
On Render, set DATABASE_URL to a managed Postgres instance for real
persistence (Render's free web-service disk is ephemeral across deploys,
so SQLite there is fine for a demo but will reset on redeploy - see README).
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./doorstep.db")

# Render (and most managed Postgres providers) hand out URLs starting with
# "postgres://", but SQLAlchemy 2.x needs the "postgresql://" scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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
