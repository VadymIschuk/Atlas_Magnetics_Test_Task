import type { AppError, JobState } from '../types/job'

type StatusPanelProps = {
  backendMessage: string | null
  currentJobId: string | null
  currentState: JobState | null
  currentError: AppError | null
}

function formatStateLabel(currentState: JobState | null) {
  if (!currentState) {
    return 'Ready'
  }

  return currentState.charAt(0).toUpperCase() + currentState.slice(1)
}

export function StatusPanel({
  backendMessage,
  currentJobId,
  currentState,
  currentError,
}: StatusPanelProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Status</p>
          <h2>Status / message area</h2>
        </div>
        {currentJobId ? <span className="job-badge">Job ID: {currentJobId}</span> : null}
      </div>

      <div className="status-stack">
        <div className="status-card">
          <div className="status-copy">
            <strong>{formatStateLabel(currentState)}</strong>
            <span>{backendMessage || 'Choose files and start processing to see backend updates.'}</span>
          </div>
        </div>

        {currentError ? (
          <div className="error-banner" role="alert">
            <strong>{currentError.error}</strong>
            {currentError.error_code ? <span>Error code: {currentError.error_code}</span> : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
