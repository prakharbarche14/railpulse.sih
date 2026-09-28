# RailPulse — Intelligent Dynamic Train ETA Prediction System

A working prototype for **Smart India Hackathon PS 028**: *Dynamic Forecast of
Expected Time of Arrival (ETA) for Coaching Trains*.

RailPulse predicts train arrival times continuously — not just from a static
timetable, but from simulated live position, speed, delay trend, historical
section performance, and dwell time — and explains *why* each prediction
changed, with a confidence score attached.

> 🟡 **This build runs entirely on simulated/demo data.** Real Indian
> Railways position feeds were not available in this environment. The
> architecture is built so a real data provider can be plugged into
> `backend/app/services/simulator.py` later without touching the prediction
> engine, API, or frontend. Simulated output is never presented as live
> railway data — every screen is labeled **DEMO DATA**.

---

## What's inside

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS + Recharts + Leaflet |
| Backend | Python + FastAPI + SQLAlchemy + Pydantic |
| Database | SQLite by default (zero config) — PostgreSQL supported via `DATABASE_URL` |
| Real-time | WebSockets, broadcasting every ~8 seconds |
| Auth | JWT (register/login), bcrypt password hashing |
| Prediction engine | Transparent rule-based baseline (`backend/app/prediction/`), architected to be swapped for XGBoost/LSTM later |

### Feature checklist

- Train search (number, name, station, type)
- Live dashboard: active trains, on-time %, delayed %, avg delay, prediction accuracy
- Train details: status, current delay, location, speed, last-updated timer
- Vertical route timeline (departed / current / upcoming) with per-station ETA + confidence
- Live map (Leaflet + OpenStreetMap): completed route, remaining route, station popups
- Scheduled vs. predicted ETA chart + delay trend chart (Recharts)
- "Why did the ETA change?" explanation card with optimistic/expected/pessimistic bounds
- Alerts: subscribe to a train, get notified on ETA change (in-app alert feed)
- Admin dashboard: MAE/RMSE, model version, data freshness, recent predictions table
- "How RailPulse Works" pipeline page for the SIH presentation
- Auth: register/login, protected routes, admin role
- Docker Compose (frontend + backend + PostgreSQL) and a non-Docker local setup
- Unit tests (prediction engine) + integration tests (API)

---

## Option A — Run everything with Docker (recommended)

Requires Docker + Docker Compose.

```bash
docker compose up --build
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Backend API** on `http://localhost:8000` (Swagger docs at `/docs`)
- **Frontend** on `http://localhost:3000`

The backend automatically creates tables and seeds demo data (5 trains, 31
stations) on first boot, and the telemetry simulator starts immediately —
open the frontend and trains will already be "moving."

To stop: `docker compose down`. To also wipe the database: `docker compose down -v`.

---

## Option B — Run locally without Docker

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # defaults to SQLite — no extra setup needed
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`). Demo data seeds automatically into
`backend/railpulse.db` on first run.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/ws`
to `http://localhost:8000` (see `frontend/vite.config.ts`), so both pieces
talk to each other with no extra configuration.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Passenger | `passenger@railpulse.demo` | `password123` |
| Admin | `admin@railpulse.demo` | `password123` |

Or register a new account from the UI — new accounts default to the
passenger role. Only the admin account can view `/admin`.

## Demo trains

`12951` Mumbai Rajdhani · `12002` New Delhi–Bhopal Shatabdi ·
`12155` Shaan-E-Bhopal Express · `12627` Karnataka Express · `12301` Howrah Rajdhani

Each loops continuously (reaches its terminus, pauses briefly, restarts) so
the demo stays lively for as long as the backend runs.

---

## Running tests

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Covers the prediction engine (feature extraction, delay model, confidence
scoring, multi-station ETA propagation) and the API (auth, search, train
detail, subscriptions, admin access control).

---

## Project structure

```
railpulse/
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, RouteTimeline, LiveMapView, charts, badges…
│   │   ├── pages/           # Landing, Dashboard, TrainDetails, LiveMap, Analytics, Admin…
│   │   ├── hooks/            # useTrainSocket (WebSocket)
│   │   ├── services/         # api.ts (REST client)
│   │   ├── store/             # authStore (Zustand)
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/              # auth, trains, analytics, admin, alerts routers
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # seed data, simulator, eta_service (DB ↔ engine bridge)
│   │   ├── prediction/       # features.py, delay_model.py, confidence.py, eta_engine.py, train_model.py
│   │   ├── websocket/        # connection manager + /ws/trains/{train_number} route
│   │   ├── auth/              # JWT + password hashing
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
│
├── docker-compose.yml
└── .env.example
```

---

## How the ETA prediction engine works

```
Train Position Data → Data Processing → Feature Extraction
   → ETA Prediction Engine → Confidence Calculation → Dynamic ETA
   → Passenger / Control Room
```

For each upcoming station, `backend/app/prediction/eta_engine.py`:

1. Builds a feature vector (`features.py`) from current speed, previous
   speed, distance remaining, current delay, historical section delay
   average/stddev, dwell time, day-of-week, hour-of-day, and recent delay
   trend.
2. Runs it through a **transparent, explainable baseline model**
   (`delay_model.py`) — no black box: every adjustment (speed trend,
   historical pattern, dwell, congestion, delay trend) is a named, visible
   term, so a judge can follow the arithmetic.
3. Scores a **confidence** (`confidence.py`) from 0–1 based on data
   freshness, distance remaining, historical volatility, and how erratic
   recent speed changes have been — surfaced as High/Medium/Low.
4. Produces optimistic / expected / pessimistic arrival bounds, sized by
   that confidence score.
5. Generates a plain-language **"why did it change"** explanation from
   whichever factor dominates the adjustment.

The baseline model works well with almost no historical data — exactly the
situation at a hackathon demo — but the architecture is intentionally
decoupled: `backend/app/prediction/train_model.py` sketches how to train an
XGBoost model on the same feature pipeline once real historical arrival data
exists, and `eta_engine.py` can call that model instead of the baseline as a
drop-in swap.

---

## Swapping in a real data source later

Everything in this prototype assumes simulated telemetry
(`backend/app/services/simulator.py`) because a live Indian Railways feed
wasn't available in this environment. To go live:

1. Replace the body of `_tick_train()` in `simulator.py` with a call to the
   real data provider instead of the random-walk simulation.
2. Keep writing to the same `TrainPosition` model — everything downstream
   (the prediction engine, WebSocket broadcast, alerts, admin analytics)
   is already wired to that table and needs no changes.
3. Remove or update the `is_demo` flag on `Train` records and the `DEMO
   DATA` badge in the frontend once real data is confirmed live.

---

## Notes & limitations (honest, for the judges)

- All train movement, delays, and positions are **simulated**, seeded with
  plausible real-world station coordinates and distances — not live GPS data.
- The admin "Model Performance Over Time" chart is backtested/synthetic
  since a short demo session won't produce enough real arrivals to compute
  live MAE/RMSE — this is labeled in the UI.
- The baseline prediction model is intentionally simple and transparent
  rather than a trained ML model, per the brief's emphasis on explainability
  and working with limited data; `train_model.py` shows the upgrade path.
