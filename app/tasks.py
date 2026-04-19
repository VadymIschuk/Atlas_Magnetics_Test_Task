from __future__ import annotations

from celery import Task

from app.services.celery_app import celery_app
from app.exceptions import CsvValidationError
from app.services.csv_processor import csv_processor_service
from app.services.upload_storage import upload_storage_service


@celery_app.task(bind=True, name="app.tasks.process_csv_files")
def process_csv_files(task: Task, files_data: list[dict[str, str]]) -> dict:
    results: list[dict] = []
    total_files = len(files_data)

    task.update_state(
        state="PROCESSING",
        meta=build_task_meta(
            job_state="processing",
            message="Processing started.",
            processed_files=0,
            total_files=total_files,
        ),
    )

    try:
        for index, file_data in enumerate(files_data, start=1):
            file_name = file_data["file_name"]

            task.update_state(
                state="PROCESSING",
                meta=build_task_meta(
                    job_state="processing",
                    message=f"Reading file {file_name}.",
                    processed_files=index - 1,
                    total_files=total_files,
                ),
            )

            analytics = csv_processor_service.build_file_analytics_from_file(file_name, file_data["file_path"])
            results.append(analytics.model_dump(mode="json"))

            task.update_state(
                state="PROCESSING",
                meta=build_task_meta(
                    job_state="processing",
                    message=f"Processed file {file_name}.",
                    processed_files=index,
                    total_files=total_files,
                ),
            )

        return build_task_meta(
            job_state="completed",
            message="Processing completed.",
            processed_files=len(results),
            total_files=total_files,
            results=results,
        )
    except CsvValidationError as exc:
        return build_task_meta(
            job_state="failed",
            message="CSV validation failed.",
            error=exc.message,
            error_code=exc.error_code,
            processed_files=len(results),
            total_files=total_files,
        )
    except Exception:
        return build_task_meta(
            job_state="failed",
            message="Processing failed.",
            error="Unexpected server error while processing the uploaded CSV file.",
            error_code="processing_error",
            processed_files=len(results),
            total_files=total_files,
        )
    finally:
        upload_storage_service.delete_saved_files(files_data)


def build_task_meta(
    job_state: str,
    message: str,
    processed_files: int,
    total_files: int,
    results: list[dict] | None = None,
    error: str | None = None,
    error_code: str | None = None,
) -> dict:
    return {
        "job_state": job_state,
        "message": message,
        "error": error,
        "error_code": error_code,
        "processed_files": processed_files,
        "total_files": total_files,
        "results": results or [],
    }
