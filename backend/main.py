import os
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
import schemas
import trust

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DoorStep Trust Network API",
    description=(
        "A community-verification layer on top of Google's Plus Codes. "
        "Households register a Plus Code; neighbours vouch for it; the "
        "resulting trust score helps a delivery rider, ambulance driver, "
        "or new visitor sanity-check an address before travelling there."
    ),
    version="1.0.0",
)

# Comma-separated list of allowed frontend origins, e.g.
# "https://doorstep-trust.vercel.app,http://localhost:5173"
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _to_household_out(h: models.Household) -> schemas.HouseholdOut:
    count = len(h.vouches)
    return schemas.HouseholdOut(
        id=h.id,
        name=h.name,
        locality=h.locality,
        plus_code=h.plus_code,
        landmark=h.landmark,
        latitude=h.latitude,
        longitude=h.longitude,
        created_at=h.created_at,
        vouch_count=count,
        trust_score=trust.trust_score(count),
        trust_tier=trust.trust_tier(count),
        vouches=sorted(h.vouches, key=lambda v: v.created_at, reverse=True),
    )


@app.get("/", tags=["meta"])
def root():
    return {
        "service": "doorstep-trust-network-api",
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.post(
    "/households",
    response_model=schemas.HouseholdOut,
    status_code=201,
    tags=["households"],
)
def create_household(payload: schemas.HouseholdCreate, db: Session = Depends(get_db)):
    coords = trust.decode_plus_code(payload.plus_code)
    if coords is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "That doesn't look like a valid full Plus Code. Full codes "
                "look like '7JVW52GR+2Q' (8-11 characters, includes a '+'). "
                "Generate one for free at plus.codes or in Google Maps."
            ),
        )

    existing = db.execute(
        select(models.Household).where(models.Household.plus_code == payload.plus_code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="A household is already registered with this Plus Code.",
        )

    lat, lng = coords
    household = models.Household(
        name=payload.name.strip(),
        locality=payload.locality.strip(),
        plus_code=payload.plus_code,
        landmark=(payload.landmark or "").strip() or None,
        phone=(payload.phone or "").strip() or None,
        latitude=lat,
        longitude=lng,
    )
    db.add(household)
    db.commit()
    db.refresh(household)
    return _to_household_out(household)


@app.get("/households", response_model=List[schemas.HouseholdSummary], tags=["households"])
def list_households(
    locality: Optional[str] = Query(None, description="Filter by locality (partial match)"),
    db: Session = Depends(get_db),
):
    q = select(models.Household)
    if locality:
        q = q.where(models.Household.locality.ilike(f"%{locality}%"))
    households = db.execute(q.order_by(models.Household.created_at.desc())).scalars().all()
    return [
        schemas.HouseholdSummary(
            id=h.id,
            name=h.name,
            locality=h.locality,
            plus_code=h.plus_code,
            vouch_count=len(h.vouches),
            trust_score=trust.trust_score(len(h.vouches)),
            trust_tier=trust.trust_tier(len(h.vouches)),
        )
        for h in households
    ]


def _get_household_or_404(plus_code: str, db: Session) -> models.Household:
    household = db.execute(
        select(models.Household).where(
            models.Household.plus_code == plus_code.strip().upper()
        )
    ).scalar_one_or_none()
    if not household:
        raise HTTPException(
            status_code=404,
            detail="No household is registered with that Plus Code yet.",
        )
    return household


@app.get(
    "/households/{plus_code}",
    response_model=schemas.HouseholdOut,
    tags=["households"],
)
def get_household(plus_code: str, db: Session = Depends(get_db)):
    return _to_household_out(_get_household_or_404(plus_code, db))


@app.post(
    "/households/{plus_code}/vouch",
    response_model=schemas.HouseholdOut,
    tags=["households"],
)
def vouch_for_household(
    plus_code: str, payload: schemas.VouchCreate, db: Session = Depends(get_db)
):
    household = _get_household_or_404(plus_code, db)

    # Lightweight duplicate-vouch guard: same phone (or name, if no phone
    # given) can't vouch for the same household twice.
    for v in household.vouches:
        same_phone = payload.voucher_phone and v.voucher_phone == payload.voucher_phone
        same_name_no_phone = not payload.voucher_phone and v.voucher_name.lower() == payload.voucher_name.strip().lower()
        if same_phone or same_name_no_phone:
            raise HTTPException(
                status_code=409,
                detail="This person has already vouched for this household.",
            )

    vouch = models.Vouch(
        household_id=household.id,
        voucher_name=payload.voucher_name.strip(),
        voucher_phone=(payload.voucher_phone or "").strip() or None,
        relation=payload.relation.strip(),
        note=(payload.note or "").strip() or None,
    )
    db.add(vouch)
    db.commit()
    db.refresh(household)
    return _to_household_out(household)


@app.get(
    "/trust-score/{plus_code}",
    response_model=schemas.HouseholdSummary,
    tags=["households"],
)
def quick_trust_check(plus_code: str, db: Session = Depends(get_db)):
    """A minimal endpoint meant for the 'about to travel there' moment -
    e.g. a delivery app or ambulance dispatch tool checking trust before
    committing to a route."""
    h = _get_household_or_404(plus_code, db)
    count = len(h.vouches)
    return schemas.HouseholdSummary(
        id=h.id,
        name=h.name,
        locality=h.locality,
        plus_code=h.plus_code,
        vouch_count=count,
        trust_score=trust.trust_score(count),
        trust_tier=trust.trust_tier(count),
    )


@app.post("/sms/simulate", response_model=schemas.SmsSimulateResponse, tags=["offline-fallback"])
def simulate_sms(payload: schemas.SmsSimulateRequest, db: Session = Depends(get_db)):
    """
    A text-based stand-in for the SMS/USSD fallback described in the
    project design: in areas without a data connection, a rider or
    volunteer could send 'TRUST <pluscode>' as a plain SMS and get a
    one-line reply back, no app or data connection required. This endpoint
    mocks what that reply would say; wiring it to a real SMS gateway
    (e.g. Twilio, Exotel) is future work called out in the README.
    """
    text = payload.message.strip()
    parts = text.split()

    if len(parts) < 2 or parts[0].upper() != "TRUST":
        return schemas.SmsSimulateResponse(
            reply="Send: TRUST <PlusCode>  e.g. TRUST 7JVW52GR+2Q"
        )

    code = parts[1].strip().upper()
    if not trust.is_valid_full_plus_code(code):
        return schemas.SmsSimulateResponse(
            reply=f"'{code}' isn't a valid Plus Code. Full codes include a '+', e.g. 7JVW52GR+2Q."
        )

    household = db.execute(
        select(models.Household).where(models.Household.plus_code == code)
    ).scalar_one_or_none()

    if not household:
        return schemas.SmsSimulateResponse(
            reply=f"No record for {code} yet. Travel with normal caution."
        )

    count = len(household.vouches)
    tier = trust.trust_tier(count)
    reply = (
        f"{code}: {household.name}, {household.locality}. "
        f"Trust: {tier} ({count} vouch{'es' if count != 1 else ''})."
    )
    return schemas.SmsSimulateResponse(reply=reply)
