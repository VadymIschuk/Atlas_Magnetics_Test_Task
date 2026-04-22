import { useState } from 'react'
import './dashboard.css'
import { ChartPanel, ResultsPanel, StatusPanel, UploadPanel } from './components'
import { useJobProcessing } from './hooks/useJobProcessing'

function mergeSelectedFiles(currentFiles: File[], nextFiles: File[]) {
  const mergedFiles = [...currentFiles]

  for (const nextFile of nextFiles) {
    const alreadySelected = mergedFiles.some(
      (currentFile) =>
        currentFile.name === nextFile.name &&
        currentFile.size === nextFile.size &&
        currentFile.lastModified === nextFile.lastModified,
    )

    if (!alreadySelected) {
      mergedFiles.push(nextFile)
    }
  }

  return mergedFiles
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const {
    activeReport,
    clearCurrentError,
    jobResults,
    handleReportSelect,
    handleSubmit,
    jobState,
    uiState,
  } = useJobProcessing(selectedFiles)

  function handleFileSelection(nextFiles: File[]) {
    setSelectedFiles((currentFiles) => mergeSelectedFiles(currentFiles, nextFiles))
    clearCurrentError()
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
    clearCurrentError()
  }

  return (
    <main className="app-shell">
      <header className="dashboard-hero">
        <div className="hero-copy">
          <h1>CSV Analytics Dashboard</h1>
          <p className="hero-text">
            Upload one or more CSV files, track processing progress, and review analytics
            results for each file.
          </p>
        </div>
      </header>

      <UploadPanel
        isSubmitting={uiState.isSubmitting}
        selectedFiles={selectedFiles}
        onFileSelection={handleFileSelection}
        onFileRemoval={handleFileRemoval}
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
      />

      <StatusPanel
        backendMessage={jobState.backendMessage}
        currentError={jobState.currentError}
        currentJobId={jobState.currentJobId}
        statusMessage={uiState.statusMessage}
        stepIndex={uiState.stepIndex}
      />

      <section className="dashboard-results-layout">
        <ResultsPanel
          activeReport={activeReport}
          jobResults={jobResults}
          isRenderingResults={uiState.isRenderingResults}
          selectedReportIndex={uiState.selectedReportIndex}
          onReportSelect={handleReportSelect}
        />

        <ChartPanel activeReport={activeReport} />
      </section>
    </main>
  )
}

export default App
