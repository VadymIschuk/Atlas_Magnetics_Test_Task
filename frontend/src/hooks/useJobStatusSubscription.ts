import { useEffect, useRef } from 'react'

import { fetchJobDetails } from '../api/jobs'
import { JOBS_WS_PATH } from '../api/constants'
import type { JobDetails, JobStatusMessage } from '../types/job'

type JobStatusSubscriptionOptions = {
  currentJobId: string | null
  onFallbackStart: () => void
  onStatusMessage: (message: JobStatusMessage) => void
}

function buildJobStatusWsUrl(jobId: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}${JOBS_WS_PATH}/${jobId}`
}

function mapJobDetailsToStatusMessage(jobDetails: JobDetails): JobStatusMessage {
  return {
    job_id: jobDetails.job_id,
    state: jobDetails.state,
    message: jobDetails.message,
    error: jobDetails.error,
    error_code: jobDetails.error_code,
    processed_files: jobDetails.processed_files,
    total_files: jobDetails.total_files,
  }
}

export function useJobStatusSubscription({
  currentJobId,
  onFallbackStart,
  onStatusMessage,
}: JobStatusSubscriptionOptions) {
  const pollingStartedRef = useRef(false)
  const pollingIntervalIdRef = useRef<number | null>(null)
  const pollingRequestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const activeJobId = currentJobId

    if (!activeJobId) {
      return
    }

    const ensuredJobId = activeJobId
    pollingStartedRef.current = false

    function stopPolling() {
      if (pollingIntervalIdRef.current !== null) {
        window.clearInterval(pollingIntervalIdRef.current)
        pollingIntervalIdRef.current = null
      }

      pollingRequestControllerRef.current?.abort()
      pollingRequestControllerRef.current = null
    }

    async function pollJobStatus() {
      pollingRequestControllerRef.current?.abort()
      const pollingController = new AbortController()
      pollingRequestControllerRef.current = pollingController

      try {
        const jobDetails = await fetchJobDetails(ensuredJobId, pollingController.signal)
        const statusMessage = mapJobDetailsToStatusMessage(jobDetails)
        onStatusMessage(statusMessage)

        if (statusMessage.state === 'completed' || statusMessage.state === 'failed') {
          stopPolling()
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    function startPollingFallback() {
      if (pollingStartedRef.current) {
        return
      }

      pollingStartedRef.current = true
      onFallbackStart()
      void pollJobStatus()
      pollingIntervalIdRef.current = window.setInterval(() => {
        void pollJobStatus()
      }, 2000)
    }

    const websocket = new WebSocket(buildJobStatusWsUrl(ensuredJobId))

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data) as JobStatusMessage
      onStatusMessage(message)
    }

    websocket.onerror = () => {
      startPollingFallback()
    }

    websocket.onclose = () => {
      startPollingFallback()
    }

    return () => {
      stopPolling()
      websocket.close()
    }
  }, [currentJobId, onFallbackStart, onStatusMessage])
}
