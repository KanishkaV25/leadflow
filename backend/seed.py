
from datetime import timedelta

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models import Lead, Discussion
from app.time_utils import utc_now

Base.metadata.create_all(bind=engine)

now = utc_now()

seed_leads = [
    {
        "name": "Sarah Connor",
        "company": "Acme Corp",
        "phone": "555-0199",
        "status": "Proposal Sent",
        "follow_up": now.replace(hour=14, minute=0, second=0, microsecond=0),
        "notes": [
            ("Initial discovery call. Interested in a CRM.", 6),
            ("Sent pricing proposal for review.", 2),
        ],
    },
    {
        "name": "Hank Scorpio",
        "company": "Globex",
        "phone": None,
        "status": "New",
        "follow_up": now + timedelta(days=2),
        "notes": [
            ("Inbound lead from website contact form.", 1),
        ],
    },
    {
        "name": "Bill Lumbergh",
        "company": "Initech",
        "phone": "555-0123",
        "status": "Contacted",
        "follow_up": now - timedelta(days=1),
        "notes": [
            ("Left a voicemail about the proposal.", 3),
        ],
    },
    {
        "name": "Bruce Wayne",
        "company": "Wayne Enterprises",
        "phone": None,
        "status": "Won",
        "follow_up": None,
        "notes": [
            ("Contract signed. Welcome package sent.", 7),
        ],
    },
    {
        "name": "Diana Prince",
        "company": "Themyscira Consulting",
        "phone": "555-0145",
        "status": "Qualified",
        "follow_up": None,
        "notes": [],
    },
    {
        "name": "Clark Kent",
        "company": "Daily Planet",
        "phone": None,
        "status": "Lost",
        "follow_up": None,
        "notes": [
            ("Customer decided not to proceed.", 4),
        ],
    },
]

with SessionLocal() as db:
    for item in seed_leads:
        existing = db.scalar(
            select(Lead).where(
                Lead.name == item["name"],
                Lead.company == item["company"],
            )
        )

        if existing:
            lead = existing
            lead.status = item["status"]
            lead.phone = item["phone"]
            lead.next_follow_up_at = item["follow_up"]
        else:
            lead = Lead(
                name=item["name"],
                company=item["company"],
                phone=item["phone"],
                status=item["status"],
                next_follow_up_at=item["follow_up"],
            )
            db.add(lead)
            db.flush()

        # Seed discussions only when this lead has no existing history.
        if not db.scalar(
            select(Discussion.id)
            .where(Discussion.lead_id == lead.id)
            .limit(1)
        ):
            for note, days_ago in item["notes"]:
                db.add(
                    Discussion(
                        lead_id=lead.id,
                        note=note,
                        created_at=now - timedelta(days=days_ago),
                    )
                )

    db.commit()

    total_leads = len(db.scalars(select(Lead)).all())
    total_discussions = len(db.scalars(select(Discussion)).all())

    print(f"Seed complete: {total_leads} leads, {total_discussions} discussions.")
