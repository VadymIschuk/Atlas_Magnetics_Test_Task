from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.celery_status import stream_job_status


router = APIRouter(tags=["status"])


@router.websocket("/ws/jobs/{job_id}")
async def job_status_websocket(websocket: WebSocket, job_id: str) -> None:
    await websocket.accept()

    try:
        async for status_message in stream_job_status(job_id):
            await websocket.send_json(status_message.model_dump(mode="json"))
    except WebSocketDisconnect:
        return
