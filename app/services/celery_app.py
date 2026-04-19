from celery import Celery

from app.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "atlas_magnetics",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_track_started=True,
    result_extended=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    imports=("app.tasks",),
)
