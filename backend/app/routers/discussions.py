
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Discussion, Lead
from app.schemas import DiscussionCreate, DiscussionOut, LeadOut
from app.time_utils import normalize_utc, utc_now

router = APIRouter(prefix="/api/leads", tags=["Discussions"])


@router.get("/{lead_id}/discussions", response_model=list[DiscussionOut])
def list_discussions(
    lead_id: int,
    db: Session = Depends(get_db),
):
    lead = db.get(Lead, lead_id)

    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")

    statement = (
        select(Discussion)
        .where(Discussion.lead_id == lead_id)
        .order_by(Discussion.created_at.desc(), Discussion.id.desc())
    )

    return db.scalars(statement).all()


@router.post(
    "/{lead_id}/discussions",
    response_model=dict,
    status_code=201,
)
def create_discussion(
    lead_id: int,
    payload: DiscussionCreate,
    db: Session = Depends(get_db),
):
    lead = db.get(Lead, lead_id)

    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")

    follow_up = (
        normalize_utc(payload.follow_up_at)
        if payload.follow_up_at is not None
        else None
    )

    discussion = Discussion(
        lead_id=lead_id,
        note=payload.note,
        created_at=utc_now(),
        follow_up_at=follow_up,
    )

    try:
        db.add(discussion)

        # A note without a new follow-up preserves the current follow-up.
        if follow_up is not None:
            lead.next_follow_up_at = follow_up

        lead.updated_at = utc_now()

        db.commit()
        db.refresh(discussion)
        db.refresh(lead)

        return {
            "discussion": DiscussionOut.model_validate(discussion),
            "lead": LeadOut.model_validate(lead),
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save discussion.",
        )
