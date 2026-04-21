import type { AppError, JobDetails } from './job'

export type JobStateModel = {
  currentJobId: string | null
  currentJob: JobDetails | null
  backendMessage: string | null
  currentError: AppError | null
}

export type UiStateModel = {
  selectedReportIndex: number
  statusMessage: string
  isSubmitting: boolean
  stepIndex: number | null
  isRenderingResults: boolean
}

export type JobProcessingResult = {
  activeReport: JobDetails['results'][number] | null
  clearCurrentError: () => void
  currentResults: JobDetails['results']
  handleReportSelect: (index: number) => void
  handleSubmit: () => Promise<void>
  jobState: JobStateModel
  uiState: UiStateModel
}
