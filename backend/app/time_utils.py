from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


def normalize_utc(value: datetime) -> datetime:
    """Normalize a datetime to UTC."""
    if value.tzinfo is None:
        # Treat naive values as UTC only when the caller guarantees that.
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)