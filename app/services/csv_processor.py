from __future__ import annotations

import random
from pathlib import Path

import pandas

from app.exceptions import CsvValidationError
from app.schemas import ChartPoint, FileAnalytics
from app.scripts.analytics import build_file_analytics
from app.settings import get_settings


class CsvProcessorService:
    def __init__(self) -> None:
        settings = get_settings()
        self.chunk_size = settings.csv_chunk_size
        self.max_chart_points = settings.csv_max_chart_points
        self.max_exact_median_values = settings.csv_max_exact_median_values
        self.max_median_sample_size = settings.csv_max_median_sample_size

    def build_file_analytics_from_file(self, file_name: str, file_path: str) -> FileAnalytics:
        analytics_data = self.parse_csv_rows(file_name, file_path)

        return build_file_analytics(
            file_name=file_name,
            chart_axis_field=analytics_data["chart_axis_field"],
            mean_value=analytics_data["mean"],
            median_value=analytics_data["median"],
            median_is_approximate=analytics_data["median_is_approximate"],
            min_value=analytics_data["min"],
            max_value=analytics_data["max"],
            chart_data=analytics_data["chart_data"],
        )

    def parse_csv_rows(self, file_name: str, file_path: str) -> dict:
        csv_path = Path(file_path)
        if not csv_path.exists():
            raise CsvValidationError(f"File {file_name} was not found for processing.", "file_not_found")

        exact_median_chunks: list[pandas.Series] = []
        median_sample_values: list[float] = []
        chart_data: list[ChartPoint] = []
        chart_axis_field: str | None = None
        total_valid_rows = 0
        total_result_sum = 0.0
        min_result_value: float | None = None
        max_result_value: float | None = None
        median_is_approximate = False

        try:
            chunks = pandas.read_csv(csv_path, chunksize=self.chunk_size, encoding="utf-8-sig")
        except UnicodeDecodeError as exc:
            raise CsvValidationError(f"File {file_name} could not be decoded as UTF-8 CSV.", "invalid_encoding") from exc
        except pandas.errors.EmptyDataError as exc:
            raise CsvValidationError(f"File {file_name} is empty.", "empty_file") from exc
        except pandas.errors.ParserError as exc:
            raise CsvValidationError(f"File {file_name} has invalid CSV structure.", "invalid_csv_structure") from exc

        for chunk in chunks:
            fieldnames = [str(column) for column in chunk.columns]

            if chart_axis_field is None:
                chart_axis_field = self.resolve_chart_axis_field(fieldnames)
                if "result" not in fieldnames or chart_axis_field is None:
                    raise CsvValidationError(
                        f"File {file_name} must contain 'result' and one of 'test_id', 'test_name', or 'index' columns.",
                        "invalid_columns",
                    )

            raw_result_values = chunk["result"]
            raw_axis_values = chunk[chart_axis_field]

            result_is_present = raw_result_values.notna() & raw_result_values.astype(str).str.strip().ne("")
            axis_is_present = raw_axis_values.notna() & raw_axis_values.astype(str).str.strip().ne("")
            row_is_present = result_is_present & axis_is_present

            numeric_result_values = pandas.to_numeric(raw_result_values, errors="coerce")
            invalid_numeric_values = row_is_present & numeric_result_values.isna()
            if invalid_numeric_values.any():
                raise CsvValidationError(f"File {file_name} contains a non-numeric result value.", "non_numeric_result")

            filtered_results = numeric_result_values[row_is_present]
            filtered_axis_values = raw_axis_values[row_is_present].astype(str)

            if filtered_results.empty:
                continue

            chunk_points = [
                ChartPoint(x_value=axis_value, result=float(result_value))
                for axis_value, result_value in zip(filtered_axis_values.tolist(), filtered_results.tolist(), strict=False)
            ]

            filtered_results = filtered_results.reset_index(drop=True)
            total_valid_rows += len(filtered_results)
            total_result_sum += float(filtered_results.sum())
            chunk_min_value = float(filtered_results.min())
            chunk_max_value = float(filtered_results.max())
            min_result_value = chunk_min_value if min_result_value is None else min(min_result_value, chunk_min_value)
            max_result_value = chunk_max_value if max_result_value is None else max(max_result_value, chunk_max_value)

            if not median_is_approximate and total_valid_rows <= self.max_exact_median_values:
                exact_median_chunks.append(filtered_results)
            else:
                if not median_is_approximate:
                    median_sample_values = self.build_initial_median_sample(exact_median_chunks)
                    exact_median_chunks = []
                    median_is_approximate = True

                self.update_numeric_sample(median_sample_values, filtered_results.tolist(), total_valid_rows)

            total_valid_rows = self.update_chart_sample(chart_data, chunk_points, total_valid_rows)

        if chart_axis_field is None or total_valid_rows == 0 or min_result_value is None or max_result_value is None:
            raise CsvValidationError(f"File {file_name} does not contain valid rows.", "no_valid_rows")

        if median_is_approximate:
            median_values = pandas.Series(median_sample_values, dtype="float64")
        else:
            median_values = pandas.concat(exact_median_chunks, ignore_index=True)

        return {
            "chart_axis_field": chart_axis_field,
            "mean": total_result_sum / total_valid_rows,
            "median": float(median_values.median()),
            "median_is_approximate": median_is_approximate,
            "min": min_result_value,
            "max": max_result_value,
            "chart_data": chart_data,
        }

    def resolve_chart_axis_field(self, fieldnames: list[str]) -> str | None:
        if "test_id" in fieldnames:
            return "test_id"

        if "test_name" in fieldnames:
            return "test_name"

        if "index" in fieldnames:
            return "index"

        return None

    def build_initial_median_sample(self, exact_median_chunks: list[pandas.Series]) -> list[float]:
        if not exact_median_chunks:
            return []

        exact_values = pandas.concat(exact_median_chunks, ignore_index=True)
        sample_size = min(len(exact_values), self.max_median_sample_size)
        if sample_size == len(exact_values):
            return [float(value) for value in exact_values.tolist()]

        sampled_values = exact_values.sample(n=sample_size, random_state=42)
        return [float(value) for value in sampled_values.tolist()]

    def update_numeric_sample(
        self,
        sample_values: list[float],
        new_values: list[float],
        total_valid_rows: int,
    ) -> None:
        seen_rows_before_chunk = total_valid_rows - len(new_values)

        for row_offset, value in enumerate(new_values, start=1):
            current_row_index = seen_rows_before_chunk + row_offset

            if len(sample_values) < self.max_median_sample_size:
                sample_values.append(float(value))
                continue

            random_index = random.randint(0, current_row_index - 1)
            if random_index < self.max_median_sample_size:
                sample_values[random_index] = float(value)

    def update_chart_sample(
        self,
        chart_data: list[ChartPoint],
        chunk_points: list[ChartPoint],
        total_valid_rows: int,
    ) -> int:
        seen_rows_before_chunk = total_valid_rows - len(chunk_points)

        for row_offset, point in enumerate(chunk_points, start=1):
            current_row_index = seen_rows_before_chunk + row_offset

            if len(chart_data) < self.max_chart_points:
                chart_data.append(point)
                continue

            random_index = random.randint(0, current_row_index - 1)
            if random_index < self.max_chart_points:
                chart_data[random_index] = point

        return total_valid_rows


csv_processor_service = CsvProcessorService()
