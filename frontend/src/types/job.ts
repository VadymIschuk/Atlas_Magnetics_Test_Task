export type JobState = 'pending' | 'processing' | 'completed' | 'failed'

export type ErrorCode =
  | 'file_not_found'
  | 'invalid_encoding'
  | 'empty_file'
  | 'invalid_csv_structure'
  | 'invalid_columns'
  | 'non_numeric_result'
  | 'no_valid_rows'
  | 'processing_error'

export type ChartPoint = {
  x_value: string
  result: number
}

export type FileAnalytics = {
  file_name: string
  chart_axis_field: 'test_id' | 'test_name' | 'index'
  mean: number
  median: number
  median_is_approximate: boolean
  min: number
  max: number
  chart_data: ChartPoint[]
}

export type JobStatusMessage = {
  job_id: string
  state: JobState
  message: string
  error: string | null
  error_code: ErrorCode | null
  processed_files: number
  total_files: number
}

export type JobDetails = JobStatusMessage & {
  results: FileAnalytics[]
}

export type UploadResponse = {
  job_id: string
  state: JobState
  message: string
  error: string | null
  error_code: ErrorCode | null
}

export type AppError = {
  error: string
  error_code: ErrorCode | null
}
