from app.db import Base, engine
from app.models import Lead, Discussion

Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")