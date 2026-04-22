import type { FormEvent } from 'react'
import type { ReactNode } from 'react'

import type { AppError, FileAnalytics } from './job'

export type UploadPanelProps = {
  isSubmitting: boolean
  selectedFiles: File[]
  onFileSelection: (files: File[]) => void
  onFileRemoval: (file: File) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export type StatusPanelProps = {
  backendMessage: string | null
  currentJobId: string | null
  currentError: AppError | null
  statusMessage: string
  stepIndex: number | null
}

export type ResultsPanelProps = {
  activeReport: FileAnalytics | null
  jobResults: FileAnalytics[]
  isRenderingResults: boolean
  selectedReportIndex: number
  onReportSelect: (index: number) => void
}

export type MetricCardProps = {
  hint?: string
  label: string
  value: string
}

export type ChartPanelProps = {
  activeReport: FileAnalytics | null
}

export type ErrorBoundaryProps = {
  children: ReactNode
}

export type ErrorBoundaryState = {
  hasError: boolean
}
