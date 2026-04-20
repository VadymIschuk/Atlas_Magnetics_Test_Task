import type { JobDetails, UploadResponse } from '../types/job'

export function buildJobStatusWsUrl(jobId: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws/jobs/${jobId}`
}

export async function createJob(files: File[]) {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await fetch('/jobs', {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json()) as UploadResponse | { detail?: string }

  if (!response.ok) {
    const detailMessage =
      'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : 'Failed to upload the selected files.'

    throw new Error(detailMessage)
  }

  return payload as UploadResponse
}

export async function fetchJobDetails(jobId: string) {
  const response = await fetch(`/jobs/${jobId}`)
  const payload = (await response.json()) as JobDetails

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Failed to load job details.')
  }

  return payload
}
