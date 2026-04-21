import { useCallback, useRef } from 'react'

import { fetchJobDetails } from '../api/jobs'
import { statusSteps } from '../constants/job'
import type { JobDetails } from '../types/job'

type CompletionSequenceCallbacks = {
  onError: (message: string) => void
  onFinish: () => void
  onStart: (jobDetails: JobDetails, stepIndex: number, statusMessage: string) => void
  onStepChange: (stepIndex: number, statusMessage: string) => void
}

function waitForDelay(delayInMilliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, delayInMilliseconds)

    function handleAbort() {
      window.clearTimeout(timeoutId)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }

    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

export function useCompletionSequence() {
  const completionSequenceControllerRef = useRef<AbortController | null>(null)

  const cancelCompletionSequence = useCallback(() => {
    completionSequenceControllerRef.current?.abort()
    completionSequenceControllerRef.current = null
  }, [])

  const startCompletionSequence = useCallback(async (
    currentJobId: string,
    callbacks: CompletionSequenceCallbacks,
  ) => {
    const activeController = completionSequenceControllerRef.current

    if (activeController && !activeController.signal.aborted) {
      return
    }

    const completionController = new AbortController()
    completionSequenceControllerRef.current = completionController

    try {
      const jobDetails = await fetchJobDetails(currentJobId, completionController.signal)
      callbacks.onStart(jobDetails, 1, statusSteps[1])

      await waitForDelay(1000, completionController.signal)
      callbacks.onStepChange(2, statusSteps[2])

      await waitForDelay(1000, completionController.signal)
      callbacks.onFinish()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      const messageText =
        error instanceof Error ? error.message : 'Failed to load processing results.'
      callbacks.onError(messageText)
    } finally {
      if (completionSequenceControllerRef.current === completionController) {
        completionSequenceControllerRef.current = null
      }
    }
  }, [])

  return {
    cancelCompletionSequence,
    startCompletionSequence,
  }
}
