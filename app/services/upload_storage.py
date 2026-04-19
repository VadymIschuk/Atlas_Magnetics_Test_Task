from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.settings import get_settings


class UploadStorageService:
    def __init__(self) -> None:
        self.base_directory = get_settings().resolve_storage_directory()

    async def save_uploaded_files(self, files: list[UploadFile]) -> list[dict[str, str]]:
        job_directory = self.base_directory / str(uuid4())
        job_directory.mkdir(parents=True, exist_ok=True)

        saved_files: list[dict[str, str]] = []
        for file in files:
            file_name = file.filename or "unknown.csv"
            file_path = job_directory / file_name
            content = await file.read()
            file_path.write_bytes(content)
            saved_files.append(
                {
                    "file_name": file_name,
                    "file_path": str(file_path.resolve()),
                }
            )

        return saved_files

    def delete_saved_files(self, files_data: list[dict[str, str]]) -> None:
        if not files_data:
            return

        parent_directory: Path | None = None
        for file_data in files_data:
            file_path = Path(file_data["file_path"])
            parent_directory = file_path.parent
            if file_path.exists():
                file_path.unlink()

        if parent_directory is not None and parent_directory.exists():
            try:
                parent_directory.rmdir()
            except OSError:
                pass


upload_storage_service = UploadStorageService()
