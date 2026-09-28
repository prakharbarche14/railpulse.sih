import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, SessionLocal
from app.services.seed import seed_if_empty
from app.services.simulator import run_simulator_loop
from app.api import auth, trains, analytics, admin, alerts
from app.websocket import routes as ws_routes

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()

    simulator_task = asyncio.create_task(run_simulator_loop())
    yield
    simulator_task.cancel()


app = FastAPI(
    title="RailPulse API",
    description=(
        "Intelligent Dynamic Train ETA Prediction System — SIH PS 028 prototype. "
        "Runs on simulated/demo train telemetry unless a real data provider is configured."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trains.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(alerts.router)
app.include_router(ws_routes.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "mode": "demo", "message": "RailPulse API is running"}
