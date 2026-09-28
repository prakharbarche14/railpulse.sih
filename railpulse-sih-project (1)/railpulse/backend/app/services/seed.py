"""
Seed data for RailPulse demo mode.

Generates 5 trains, 31 stations, full routes with realistic-ish
distances/timings, historical delay statistics per leg, and one live
"current position" per train so the dashboard looks alive immediately
after a fresh `docker compose up` / local run — no manual setup needed.

All of this is clearly demo/simulated data (see app.is_demo == True on
every train) and is never presented to the user as live railway data.
"""
import random
from sqlalchemy.orm import Session

from app.models.models import Train, Station, RouteStop, TrainPosition, User, UserRole
from app.auth.security import hash_password

random.seed(42)


def _mm(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def _wrap_hhmm(total_minutes: int) -> str:
    total_minutes = total_minutes % (24 * 60)
    h, m = divmod(total_minutes, 60)
    return f"{h:02d}:{m:02d}"


STATIONS = [
    # code, name, lat, lon
    ("MMCT", "Mumbai Central", 18.9696, 72.8194),
    ("ST", "Surat", 21.1702, 72.8311),
    ("BRC", "Vadodara Jn", 22.3072, 73.1812),
    ("RTM", "Ratlam Jn", 23.3315, 75.0367),
    ("KOTA", "Kota Jn", 25.2138, 75.8648),
    ("SWM", "Sawai Madhopur", 26.0173, 76.3527),
    ("MTJ", "Mathura Jn", 27.4924, 77.6737),
    ("NDLS", "New Delhi", 28.6435, 77.2197),
    ("NZM", "Delhi Hazrat Nizamuddin", 28.5877, 77.2513),
    ("AGC", "Agra Cantt", 27.1591, 77.9910),
    ("GWL", "Gwalior Jn", 26.2183, 78.1828),
    ("JHS", "Jhansi Jn", 25.4484, 78.5685),
    ("BINA", "Bina Jn", 24.1911, 78.2179),
    ("VD", "Vidisha", 23.5251, 77.8081),
    ("BPL", "Bhopal Jn", 23.2599, 77.4126),
    ("NGP", "Nagpur Jn", 21.1458, 79.0882),
    ("WR", "Wardha Jn", 20.7453, 78.6022),
    ("BPQ", "Balharshah", 19.8447, 79.8536),
    ("KZJ", "Kazipet Jn", 17.9784, 79.5941),
    ("SC", "Secunderabad Jn", 17.4399, 78.4983),
    ("GTL", "Guntakal Jn", 15.1669, 77.3714),
    ("DMM", "Dharmavaram Jn", 14.4144, 77.7183),
    ("SBC", "Bengaluru City", 12.9767, 77.5713),
    ("HWH", "Howrah Jn", 22.5851, 88.3468),
    ("DHN", "Dhanbad Jn", 23.7957, 86.4304),
    ("ASN", "Asansol Jn", 23.6739, 86.9524),
    ("GAYA", "Gaya Jn", 24.7955, 84.9994),
    ("SSM", "Sasaram", 24.9505, 84.0247),
    ("DDU", "Pt. Deen Dayal Upadhyaya Jn", 25.2814, 83.1256),
    ("ALD", "Prayagraj Jn", 25.4304, 81.8437),
    ("CNB", "Kanpur Central", 26.4519, 80.3517),
]

# (train_number, name, type, [ (station_code, hhmm, distance_km), ... ])
TRAINS = [
    (
        "12951", "Mumbai Rajdhani", "Rajdhani",
        [
            ("MMCT", "06:00", 0),
            ("ST", "08:12", 263),
            ("BRC", "09:38", 392),
            ("RTM", "12:05", 663),
            ("KOTA", "14:20", 875),
            ("SWM", "15:32", 985),
            ("MTJ", "17:20", 1225),
            ("NDLS", "19:05", 1384),
        ],
    ),
    (
        "12002", "New Delhi–Bhopal Shatabdi", "Shatabdi",
        [
            ("NDLS", "06:15", 0),
            ("AGC", "08:22", 200),
            ("GWL", "09:52", 306),
            ("JHS", "10:47", 403),
            ("BINA", "12:44", 550),
            ("BPL", "14:05", 707),
        ],
    ),
    (
        "12155", "Shaan-E-Bhopal Express", "Express",
        [
            ("NZM", "12:00", 0),
            ("MTJ", "13:40", 141),
            ("AGC", "14:30", 188),
            ("GWL", "15:45", 293),
            ("JHS", "16:40", 390),
            ("BINA", "18:20", 537),
            ("VD", "19:35", 600),
            ("BPL", "20:30", 662),
        ],
    ),
    (
        "12627", "Karnataka Express", "Express",
        [
            ("NDLS", "05:30", 0),
            ("MTJ", "07:40", 141),
            ("NGP", "14:20", 1092),
            ("WR", "15:05", 1140),
            ("BPQ", "16:35", 1258),
            ("KZJ", "18:10", 1390),
            ("SC", "19:35", 1497),
            ("GTL", "22:40", 1774),
            ("DMM", "23:50", 1855),
            ("SBC", "01:30", 1955),
        ],
    ),
    (
        "12301", "Howrah Rajdhani", "Rajdhani",
        [
            ("HWH", "14:00", 0),
            ("DHN", "16:00", 261),
            ("ASN", "16:45", 300),
            ("GAYA", "19:30", 570),
            ("SSM", "20:35", 645),
            ("DDU", "21:40", 720),
            ("ALD", "22:50", 810),
            ("CNB", "01:20", 1000),
            ("NDLS", "05:15", 1450),
        ],
    ),
]

# Which leg (0-indexed position in that train's stop list, referring to the
# *arrival* station of the leg) each demo train is currently mid-journey on,
# and roughly how far through that leg (0..1).
CURRENT_LEG = {
    "12951": (3, 0.55),   # heading toward Kota
    "12002": (2, 0.4),    # heading toward Jhansi
    "12155": (7, 0.35),   # heading toward Bhopal (matches doc's Vidisha->Bhopal example)
    "12627": (1, 0.2),    # heading toward Mathura
    "12301": (4, 0.6),    # heading toward Sasaram
}

DWELL_BY_TYPE = {"Rajdhani": 3, "Shatabdi": 2, "Express": 4}


def seed_if_empty(db: Session) -> None:
    if db.query(Train).count() > 0:
        return  # already seeded

    station_objs = {}
    for code, name, lat, lon in STATIONS:
        st = Station(station_code=code, station_name=name, latitude=lat, longitude=lon)
        db.add(st)
        station_objs[code] = st
    db.flush()

    for train_number, name, ttype, stops in TRAINS:
        train = Train(
            train_number=train_number,
            train_name=name,
            train_type=ttype,
            origin_station_code=stops[0][0],
            destination_station_code=stops[-1][0],
            is_demo=True,
        )
        db.add(train)
        db.flush()

        prev_dist = 0
        for seq, (code, hhmm, dist) in enumerate(stops):
            leg_km = dist - prev_dist
            hist_delay = round(random.uniform(2, 12) + (0 if seq else 0), 1)
            hist_stddev = round(random.uniform(2, 8), 1)
            avg_travel = round((leg_km / random.uniform(55, 85)) * 60, 1) if leg_km else 0.0
            dwell = float(DWELL_BY_TYPE.get(ttype, 3)) + (2 if seq in (0, len(stops) - 1) else 0)

            db.add(
                RouteStop(
                    train_id=train.id,
                    station_id=station_objs[code].id,
                    sequence=seq,
                    scheduled_arrival=hhmm,
                    scheduled_departure=_wrap_hhmm(_mm(hhmm) + int(dwell)),
                    distance_from_origin_km=float(dist),
                    avg_dwell_minutes=dwell,
                    historical_avg_delay_minutes=hist_delay,
                    historical_delay_stddev=hist_stddev,
                )
            )
            prev_dist = dist
        db.flush()

        # Seed one "live" position per train so the dashboard has data
        # immediately on first run.
        leg_idx, progress = CURRENT_LEG[train_number]
        leg_idx = min(leg_idx, len(stops) - 1)
        prev_stop = stops[leg_idx - 1] if leg_idx > 0 else stops[0]
        next_stop = stops[leg_idx]
        leg_km = max(next_stop[2] - prev_stop[2], 1)
        covered = leg_km * progress
        remaining = leg_km - covered

        prev_station = station_objs[prev_stop[0]]
        next_station = station_objs[next_stop[0]]
        lat = prev_station.latitude + (next_station.latitude - prev_station.latitude) * progress
        lon = prev_station.longitude + (next_station.longitude - prev_station.longitude) * progress

        speed = round(random.uniform(58, 82), 1)
        delay = round(random.uniform(4, 20), 1)

        db.add(
            TrainPosition(
                train_id=train.id,
                latitude=lat,
                longitude=lon,
                speed_kmh=speed,
                prev_speed_kmh=round(speed + random.uniform(-8, 8), 1),
                current_delay_minutes=delay,
                last_station_code=prev_stop[0],
                next_station_code=next_stop[0],
                distance_to_next_km=round(remaining, 1),
                status="running",
            )
        )

    # Demo users: one passenger, one admin. Password for both: "password123"
    db.add(
        User(
            name="Aisha Verma",
            email="passenger@railpulse.demo",
            password_hash=hash_password("password123"),
            role=UserRole.passenger,
        )
    )
    db.add(
        User(
            name="Control Room Admin",
            email="admin@railpulse.demo",
            password_hash=hash_password("password123"),
            role=UserRole.admin,
        )
    )

    db.commit()
