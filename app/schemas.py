from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


JobState = Literal["pending", "processing", "completed", "failed"]
ChartAxisField = Literal["test_id", "test_name", "index"]
ErrorCode = Literal[
    "file_not_found",
    "invalid_encoding",
    "empty_file",
    "invalid_csv_structure",
    "invalid_columns",
    "non_numeric_result",
    "no_valid_rows",
    "processing_error",
]


class ChartPoint(BaseModel):
    x_value: str
    result: float


class FileAnalytics(BaseModel):
    file_name: str
    chart_axis_field: ChartAxisField
    mean: float
    median: float
    median_is_approximate: bool = False
    min: float
    max: float
    chart_data: list[ChartPoint]


class JobStatusMessage(BaseModel):
    job_id: str
    state: JobState
    message: str
    error: str | None = None
    error_code: ErrorCode | None = None
    processed_files: int = 0
    total_files: int = 0


class JobDetails(BaseModel):
    job_id: str
    state: JobState
    message: str
    error: str | None = None
    error_code: ErrorCode | None = None
    processed_files: int = 0
    total_files: int = 0
    results: list[FileAnalytics] = Field(default_factory=list)


class UploadResponse(BaseModel):
    job_id: str
    state: JobState
    message: str
    error: str | None = None
    error_code: ErrorCode | None = None
