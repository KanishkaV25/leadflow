from datetime import datetime, timezone

from app.db import SessionLocal
from app.models import Lead
from app.time_utils import normalize_utc, utc_now

db = SessionLocal()

try:
    original = normalize_utc(utc_now())

    lead = Lead(
        name="Timestamp Test",
        status="New",
        created_at=original,
        updated_at=original,
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    retrieved = db.get(Lead, lead.id)

    restored = normalize_utc(retrieved.created_at)

    assert restored == original, (
        f"Timestamp mismatch: original={original}, restored={restored}"
    )

    print("Timestamp round-trip passed.")
    print("Stored instant:", restored.isoformat())

    db.delete(retrieved)
    db.commit()

finally:
    db.close()