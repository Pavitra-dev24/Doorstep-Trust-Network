from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class VouchCreate(BaseModel):
    voucher_name: str = Field(..., min_length=2, max_length=80)
    voucher_phone: Optional[str] = Field(None, max_length=20)
    relation: str = Field(..., min_length=2, max_length=60)
    note: Optional[str] = Field(None, max_length=280)


class VouchOut(BaseModel):
    id: str
    voucher_name: str
    relation: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HouseholdCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    locality: str = Field(..., min_length=2, max_length=100)
    plus_code: str = Field(..., min_length=6, max_length=20)
    landmark: Optional[str] = Field(None, max_length=200)
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("plus_code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()


class HouseholdOut(BaseModel):
    id: str
    name: str
    locality: str
    plus_code: str
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    vouch_count: int
    trust_score: int
    trust_tier: str
    vouches: List[VouchOut] = []

    class Config:
        from_attributes = True


class HouseholdSummary(BaseModel):
    id: str
    name: str
    locality: str
    plus_code: str
    vouch_count: int
    trust_score: int
    trust_tier: str

    class Config:
        from_attributes = True


class SmsSimulateRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=160)


class SmsSimulateResponse(BaseModel):
    reply: str
