import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { fetchJobDetails, createJob, buildJobStatusWsUrl } from './api/jobs'
import { ChartPanel } from './components/ChartPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { StatusPanel } from './components/StatusPanel'
import { UploadPanel } from './components/UploadPanel'
import type { AppError, JobDetails, JobState, JobStatusMessage } from './types/job'
import { mergeSelectedFiles, validateCsvFiles } from './utils/csv'

function buildAppError(error: string, error_code: AppError['error_code']): AppError {
  return { error, error_code }
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedReportIndex, setSelectedReportIndex] = useState(0)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<JobDetails | null>(null)
  const [currentState, setCurrentState] = useState<JobState | null>(null)
  const [backendMessage, setBackendMessage] = useState<string | null>(null)
  const [currentError, setCurrentError] = useState<AppError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const completionHandledRef = useRef(false)

  useEffect(() => {
    if (!currentJobId) {
      return
    }

    const websocket = new WebSocket(buildJobStatusWsUrl(currentJobId))

    websocket.onmessage = async (event) => {
      const message = JSON.parse(event.data) as JobStatusMessage

      setCurrentState(message.state)
      setBackendMessage(message.message)

      if (message.state === 'failed') {
        setIsSubmitting(false)
        setIsLoadingResults(false)
        setCurrentJob(null)
        setCurrentError(buildAppError(message.error || message.message, message.error_code))
        completionHandledRef.current = false
        websocket.close()
        return
      }

      if (message.state === 'completed' && !completionHandledRef.current) {
        try {
          const jobDetails = await fetchJobDetails(currentJobId)
          completionHandledRef.current = true
          setIsSubmitting(false)
          setIsLoadingResults(true)
          setCurrentState(jobDetails.state)
          setCurrentJob(jobDetails)
          setSelectedReportIndex(0)
          setIsLoadingResults(false)
        } catch (error) {
          const messageText =
            error instanceof Error ? error.message : 'Failed to load processing results.'
          setCurrentError(buildAppError(messageText, 'processing_error'))
          setIsLoadingResults(false)
        }
      }
    }

    websocket.onerror = () => {
      if (!completionHandledRef.current) {
        setCurrentError(
          buildAppError(
            'Live status connection failed. Please refresh the page and try again.',
            'processing_error',
          ),
        )
      }
    }

    return () => {
      websocket.close()
    }
  }, [currentJobId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFiles.length) {
      setCurrentError(buildAppError('Please choose at least one CSV file before submitting.', null))
      return
    }

    const validationError = await validateCsvFiles(selectedFiles)
    if (validationError) {
      setCurrentError(validationError)
      return
    }

    setCurrentJobId(null)
    setCurrentJob(null)
    setCurrentState('pending')
    setSelectedReportIndex(0)
    setIsSubmitting(true)
    setIsLoadingResults(false)
    setCurrentError(null)
    setBackendMessage(null)
    completionHandledRef.current = false

    try {
      const uploadResponse = await createJob(selectedFiles)
      setCurrentJobId(uploadResponse.job_id)
      setCurrentState(uploadResponse.state)
      setBackendMessage(uploadResponse.message)
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : 'Failed to upload the selected files.'
      setIsSubmitting(false)
      setCurrentState('failed')
      setBackendMessage(null)
      setCurrentError(buildAppError(messageText, 'processing_error'))
    }
  }

  function handleFileSelection(fileList: FileList | null) {
    const nextFiles = fileList ? Array.from(fileList) : []
    setSelectedFiles((currentFiles) => mergeSelectedFiles(currentFiles, nextFiles))
    setCurrentError(null)
  }

  function handleFileRemoval(fileToRemove: File) {
    setSelectedFiles((currentFiles) =>
      currentFiles.filter(
        (currentFile) =>
          !(
            currentFile.name === fileToRemove.name &&
            currentFile.size === fileToRemove.size &&
            currentFile.lastModified === fileToRemove.lastModified
          ),
      ),
    )
  }

  const currentResults = currentJob?.results ?? []
  const activeReport = currentResults[selectedReportIndex] ?? null

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div className="hero-copy">
          <h1>CSV Analytics Dashboard</h1>
          <p className="hero-text">
            Upload one or more CSV files, track processing progress, and review analytics
            results for each file.
          </p>
        </div>
      </header>

      <UploadPanel
        isSubmitting={isSubmitting}
        selectedFiles={selectedFiles}
        onFileSelection={handleFileSelection}
        onFileRemoval={handleFileRemoval}
        onSubmit={handleSubmit}
      />

      <StatusPanel
        backendMessage={backendMessage}
        currentError={currentError}
        currentJobId={currentJobId}
        currentState={currentState}
      />

      <section className="results-grid">
        <ResultsPanel
          currentJobResults={currentResults}
          isRenderingResults={isLoadingResults}
          selectedReportIndex={selectedReportIndex}
          onReportSelect={setSelectedReportIndex}
        />

        <ChartPanel activeReport={activeReport} />
      </section>
    </main>
  )
}

export default App
