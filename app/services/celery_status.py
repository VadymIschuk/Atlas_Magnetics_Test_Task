from __future__ import annotations

import asyncio

from celery.result import AsyncResult
from fastapi import HTTPException, status

from app.schemas import FileAnalytics, JobDetails, JobStatusMessage
from app.services.celery_app import celery_app


def get_job_details(job_id: str) -> JobDetails:
    task_result = AsyncResult(job_id, app=celery_app)
    payload = build_job_payload(job_id, task_result)
    results = [FileAnalytics.model_validate(item) for item in payload["results"]]

    return JobDetails(
        job_id=job_id,
        state=payload["state"],
        message=payload["message"],
        error=payload["error"],
        error_code=payload["error_code"],
        processed_files=payload["processed_files"],
        total_files=payload["total_files"],
        results=results,
    )


async def stream_job_status(job_id: str):
    previous_status: JobStatusMessage | None = None

    while True:
        job_details = get_job_details(job_id)
        status_message = JobStatusMessage(
            job_id=job_details.job_id,
            state=job_details.state,
            message=job_details.message,
            error=job_details.error,
            error_code=job_details.error_code,
            processed_files=job_details.processed_files,
            total_files=job_details.total_files,
        )

        if status_message != previous_status:
            previous_status = status_message
            yield status_message

        if job_details.state in {"completed", "failed"}:
            break

        await asyncio.sleep(1)


def build_job_payload(job_id: str, task_result: AsyncResult) -> dict:
    meta = extract_task_meta(task_result)

    if task_result.state == "PENDING":
        return {
            "job_id": job_id,
            "state": "pending",
            "message": "Job is waiting to be processed.",
            "error": None,
            "error_code": None,
            "processed_files": 0,
            "total_files": 0,
            "results": [],
        }

    return {
        "job_id": job_id,
        "state": resolve_job_state(task_result.state, meta),
        "message": meta.get("message", resolve_default_message(task_result.state, meta)),
        "error": meta.get("error"),
        "error_code": meta.get("error_code"),
        "processed_files": meta.get("processed_files", 0),
        "total_files": meta.get("total_files", 0),
        "results": meta.get("results", []),
    }


def extract_task_meta(task_result: AsyncResult) -> dict:
    if isinstance(task_result.result, dict):
        return task_result.result

    if isinstance(task_result.info, dict):
        return task_result.info

    if task_result.state == "FAILURE":
        return {
            "job_state": "failed",
            "message": "Processing failed.",
            "error": str(task_result.result),
            "error_code": "processing_error",
            "processed_files": 0,
            "total_files": 0,
            "results": [],
        }

    return {}


def resolve_job_state(celery_state: str, meta: dict) -> str:
    job_state = meta.get("job_state")
    if isinstance(job_state, str):
        return job_state

    if celery_state == "PENDING":
        return "pending"

    if celery_state in {"STARTED", "PROCESSING", "RETRY"}:
        return "processing"

    if celery_state == "SUCCESS":
        return "completed"

    if celery_state in {"FAILURE", "REVOKED"}:
        return "failed"

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unknown job state.")


def resolve_default_message(celery_state: str, meta: dict) -> str:
    state = resolve_job_state(celery_state, meta)

    if state == "pending":
        return "Job is waiting to be processed."

    if state == "processing":
        return "Processing started."

    if state == "completed":
        return "Processing completed."

    if state == "failed":
        return "Processing failed."

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unknown job state.")
