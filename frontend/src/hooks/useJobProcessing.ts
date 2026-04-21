import { useCallback, useState } from 'react'

import { createJob } from '../api/jobs'
import { statusSteps } from '../constants/job'
import type { JobProcessingResult, JobStateModel, UiStateModel } from '../types/app'
import type { JobStatusMessage } from '../types/job'
import { buildAppError } from '../utils/app-error'
import { validateCsvFiles } from '../utils/csv'
import { useCompletionSequence } from './useCompletionSequence'
import { useJobStatusSubscription } from './useJobStatusSubscription'

function createDefaultJobState(): JobStateModel {
  return {
    currentJobId: null,
    currentJob: null,
    backendMessage: null,
    currentError: null,
  }
}

function createDefaultUiState(): UiStateModel {
  return {
    selectedReportIndex: 0,
    statusMessage: 'Choose one or more CSV files to begin processing.',
    isSubmitting: false,
    stepIndex: null,
    isRenderingResults: false,
  }
}

export function useJobProcessing(selectedFiles: File[]): JobProcessingResult {
  const [jobState, setJobState] = useState<JobStateModel>(createDefaultJobState)
  const [uiState, setUiState] = useState<UiStateModel>(createDefaultUiState)
  const { cancelCompletionSequence, startCompletionSequence } = useCompletionSequence()

  function updateJobState(patch: Partial<JobStateModel>) {
    setJobState((currentState) => ({
      ...currentState,
      ...patch,
    }))
  }

  function updateUiState(patch: Partial<UiStateModel>) {
    setUiState((currentState) => ({
      ...currentState,
      ...patch,
    }))
  }

  const handleStatusMessage = useCallback(
    async (message: JobStatusMessage) => {
      updateJobState({ backendMessage: message.message })

      if (message.state === 'failed') {
        cancelCompletionSequence()
        updateUiState({
          isSubmitting: false,
          isRenderingResults: false,
          stepIndex: null,
          statusMessage: message.error || message.message,
        })
        updateJobState({
          currentJob: null,
          currentError: buildAppError(message.error || message.message, message.error_code),
        })
        return
      }

      if (message.state === 'pending' || message.state === 'processing') {
        updateUiState({
          stepIndex: 0,
          statusMessage: statusSteps[0],
        })
      }

      if (message.state === 'completed') {
        await startCompletionSequence(message.job_id, {
          onStart: (jobDetails, stepIndex, statusMessage) => {
            updateUiState({
              isSubmitting: false,
              isRenderingResults: true,
              stepIndex,
              statusMessage,
            })
            updateJobState({ currentJob: jobDetails })
          },
          onStepChange: (stepIndex, statusMessage) => {
            updateUiState({
              stepIndex,
              statusMessage,
            })
          },
          onFinish: () => {
            updateUiState({
              selectedReportIndex: 0,
              isRenderingResults: false,
            })
          },
          onError: (messageText) => {
            updateUiState({
              statusMessage: messageText,
              isRenderingResults: false,
            })
            updateJobState({
              currentError: buildAppError(messageText, 'processing_error'),
            })
          },
        })
      }
    },
    [startCompletionSequence],
  )

  const handleFallbackStart = useCallback(() => {
    updateJobState({
      backendMessage: 'Live connection is unavailable. Checking job status automatically.',
    })
  }, [])

  useJobStatusSubscription({
    currentJobId: jobState.currentJobId,
    onFallbackStart: handleFallbackStart,
    onStatusMessage: handleStatusMessage,
  })

  async function handleSubmit() {
    if (!selectedFiles.length) {
      updateJobState({
        currentError: buildAppError('Please choose at least one CSV file before submitting.', null),
      })
      return
    }

    const validationError = await validateCsvFiles(selectedFiles)
    if (validationError) {
      updateJobState({ currentError: validationError })
      return
    }

    cancelCompletionSequence()
    setJobState(createDefaultJobState())
    setUiState({
      selectedReportIndex: 0,
      statusMessage: statusSteps[0],
      isSubmitting: true,
      stepIndex: 0,
      isRenderingResults: false,
    })

    try {
      const uploadResponse = await createJob(selectedFiles)
      updateJobState({
        currentJobId: uploadResponse.job_id,
        backendMessage: uploadResponse.message,
      })
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Failed to upload the selected files.'
      updateUiState({
        isSubmitting: false,
        stepIndex: null,
        statusMessage: messageText,
      })
      updateJobState({
        currentError: buildAppError(messageText, 'processing_error'),
      })
    }
  }

  function handleReportSelect(index: number) {
    updateUiState({ selectedReportIndex: index })
  }

  function clearCurrentError() {
    updateJobState({ currentError: null })
  }

  const currentResults = jobState.currentJob?.results ?? []
  const activeReport = currentResults[uiState.selectedReportIndex] ?? null

  return {
    activeReport,
    clearCurrentError,
    currentResults,
    handleReportSelect,
    handleSubmit,
    jobState,
    uiState,
  }
}
