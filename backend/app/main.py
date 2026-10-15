
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.leads import router as leads_router
from app.routers.discussions import router as discussions_router

app = FastAPI(title="LeadFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router)
app.include_router(discussions_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
