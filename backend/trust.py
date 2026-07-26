"""
Trust-scoring and Open Location Code (Plus Code) helpers.

The scoring model is intentionally simple and transparent (the report's own
design brief calls for an explainable score, not a black box) - see the
trust tier table below. It is a starting point meant to be tuned once real
pilot data (Part IV of the report) is available.
"""
from typing import Optional, Tuple
from openlocationcode import openlocationcode as olc

TIERS = [
    (0, 0, "New"),
    (1, 2, "Building Trust"),
    (3, 5, "Verified"),
    (6, 10 ** 9, "Highly Trusted"),
]

POINTS_PER_VOUCH = 15
MAX_SCORE = 100


def is_valid_full_plus_code(code: str) -> bool:
    """A *full* Plus Code (not a short code like '8Q7X+2X Locality') is
    required so a code can be resolved to coordinates without needing a
    reference location - important for an offline/SMS flow."""
    code = code.strip().upper()
    return olc.isValid(code) and olc.isFull(code)


def decode_plus_code(code: str) -> Optional[Tuple[float, float]]:
    if not is_valid_full_plus_code(code):
        return None
    area = olc.decode(code.strip().upper())
    return area.latitudeCenter, area.longitudeCenter


def trust_tier(vouch_count: int) -> str:
    for low, high, label in TIERS:
        if low <= vouch_count <= high:
            return label
    return "New"


def trust_score(vouch_count: int) -> int:
    return min(MAX_SCORE, vouch_count * POINTS_PER_VOUCH)
