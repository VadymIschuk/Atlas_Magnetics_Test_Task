from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas import JobDetails, UploadResponse
from app.services.celery_status import get_job_details
from app.services.upload_storage import upload_storage_service
from app.tasks import process_csv_files


router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("", response_model=UploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_job(files: Annotated[list[UploadFile], File(...)]) -> UploadResponse:
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files uploaded.")

    if any(file.filename in (None, "") for file in files):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more uploaded files are invalid.")

    saved_files = await upload_storage_service.save_uploaded_files(files)
    task = process_csv_files.delay(saved_files)

    return UploadResponse(
        job_id=task.id,
        state="pending",
        message="Job created.",
        error=None,
        error_code=None,
    )


@router.get("/{job_id}", response_model=JobDetails)
async def get_job(job_id: str) -> JobDetails:
    return get_job_details(job_id)
