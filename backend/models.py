import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def _uuid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


class Household(Base):
    __tablename__ = "households"

    id = Column(String, primary_key=True, default=_uuid)
    plus_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    locality = Column(String, nullable=False, index=True)
    landmark = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=_now)

    vouches = relationship(
        "Vouch", back_populates="household", cascade="all, delete-orphan"
    )


class Vouch(Base):
    __tablename__ = "vouches"

    id = Column(String, primary_key=True, default=_uuid)
    household_id = Column(String, ForeignKey("households.id"), nullable=False)
    voucher_name = Column(String, nullable=False)
    voucher_phone = Column(String, nullable=True)
    relation = Column(String, nullable=False)  # e.g. "Neighbour", "Kirana store owner"
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_now)

    household = relationship("Household", back_populates="vouches")
