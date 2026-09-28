"""
Simple in-memory WebSocket connection manager, keyed by train_number.

For a hackathon-scale demo a single-process in-memory manager is the
right level of complexity — swapping to a Redis pub/sub backed manager
would be a drop-in change if RailPulse needed multi-process scaling.
"""
import json
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, train_number: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(train_number, []).append(websocket)

    def disconnect(self, train_number: str, websocket: WebSocket) -> None:
        conns = self.active.get(train_number, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns and train_number in self.active:
            del self.active[train_number]

    async def broadcast(self, train_number: str, payload: dict) -> None:
        dead = []
        for ws in self.active.get(train_number, []):
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(train_number, ws)


manager = ConnectionManager()
