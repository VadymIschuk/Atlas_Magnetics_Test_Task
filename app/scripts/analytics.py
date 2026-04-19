import pandas

from app.schemas import ChartPoint, FileAnalytics


def build_file_analytics(
    file_name: str,
    chart_axis_field: str,
    mean_value: float,
    median_value: float,
    median_is_approximate: bool,
    min_value: float,
    max_value: float,
    chart_data: list[ChartPoint],
) -> FileAnalytics:
    return FileAnalytics(
        file_name=file_name,
        chart_axis_field=chart_axis_field,
        mean=mean_value,
        median=median_value,
        median_is_approximate=median_is_approximate,
        min=min_value,
        max=max_value,
        chart_data=chart_data,
    )
