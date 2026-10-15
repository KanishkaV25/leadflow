from fastapi import FastAPI

from app.routers.leads import router as leads_router
from app.routers.discussions import router as discussions_router

app = FastAPI(title="LeadFlow API")

app.include_router(leads_router)
app.include_router(discussions_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}