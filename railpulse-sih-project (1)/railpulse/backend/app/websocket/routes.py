from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/trains/{train_number}")
async def train_updates_ws(websocket: WebSocket, train_number: str):
    await manager.connect(train_number, websocket)
    try:
        while True:
            # We don't expect inbound messages, but keep the socket alive
            # and tolerate any client pings/heartbeats.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(train_number, websocket)
    except Exception:
        manager.disconnect(train_number, websocket)
