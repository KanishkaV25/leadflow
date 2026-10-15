from app.db import SessionLocal
from app.models import Lead

db = SessionLocal()

try:
    lead = Lead(
        name="Test Lead",
        company="Test Company",
        phone=None,
        status="New",
    )

    db.add(lead)
    db.commit()
    db.refresh(lead)

    lead_id = lead.id
    print(f"Lead saved successfully. ID: {lead_id}")

    saved_lead = db.get(Lead, lead_id)

    print(f"Retrieved name: {saved_lead.name}")
    print(f"Retrieved status: {saved_lead.status}")

    db.delete(saved_lead)
    db.commit()

    print("Test lead deleted successfully.")

finally:
    db.close()