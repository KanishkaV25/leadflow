from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.models import Lead
from app.schemas import LeadCreate, LeadOut, LeadStatus

router = APIRouter(prefix="/api/leads", tags=["Leads"])


@router.get("", response_model=list[LeadOut])
def list_leads(
    status: LeadStatus | None = None,
    q: str | None = Query(default=None, max_length=120),
    db: Session = Depends(get_db),
):
    statement = select(Lead)

    if status is not None:
        statement = statement.where(Lead.status == status.value)

    if q and q.strip():
        statement = statement.where(
            Lead.name.ilike(f"%{q.strip()}%")
        )

    statement = statement.order_by(Lead.id.desc())

    return db.scalars(statement).all()


@router.post("", response_model=LeadOut, status_code=201)
def create_lead(
    payload: LeadCreate,
    db: Session = Depends(get_db),
):
    lead = Lead(
        name=payload.name,
        company=payload.company,
        phone=payload.phone,
        status=LeadStatus.NEW.value,
    )

    db.add(lead)

    try:
        db.commit()
        db.refresh(lead)
        return lead
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create lead.",
        )





class LeadUpdate(BaseModel):
    status: LeadStatus | None = None
    next_follow_up_at: datetime | None = None


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead(
    lead_id: int,
    payload: LeadUpdate,
    db: Session = Depends(get_db),
):
    lead = db.get(Lead, lead_id)

    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found.")

    fields = payload.model_fields_set

    if not fields:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one field to update.",
        )

    if "status" in fields:
        if payload.status is None:
            raise HTTPException(
                status_code=422,
                detail="Status cannot be null.",
            )
        lead.status = payload.status.value

    if "next_follow_up_at" in fields:
        value = payload.next_follow_up_at

        if value is None:
            lead.next_follow_up_at = None
        else:
            if value.tzinfo is None:
                raise HTTPException(
                    status_code=422,
                    detail="Follow-up timestamp must include a timezone.",
                )
            lead.next_follow_up_at = value.astimezone(timezone.utc)

    lead.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(lead)
        return lead
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update lead.",
        )

