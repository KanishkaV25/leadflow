
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class LeadStatus(str, Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    PROPOSAL_SENT = "Proposal Sent"
    WON = "Won"
    LOST = "Lost"


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank.")
        return value


class LeadStatusUpdate(BaseModel):
    status: LeadStatus | None = None
    next_follow_up_at: datetime | None = None


class DiscussionCreate(BaseModel):
    note: str = Field(min_length=1, max_length=5000)
    follow_up_at: datetime | None = None

    @field_validator("note")
    @classmethod
    def validate_note(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Discussion note cannot be blank.")
        return value


class DiscussionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    note: str
    created_at: datetime
    follow_up_at: datetime | None


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    next_follow_up_at: datetime | None
    created_at: datetime
    updated_at: datetime
    last_discussion_note: str | None = None
    last_discussion_at: datetime | None = None