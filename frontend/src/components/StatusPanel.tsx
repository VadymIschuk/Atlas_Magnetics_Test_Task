import type { AppError } from '../types/job'
import { statusSteps } from '../constants/job'

type StatusPanelProps = {
  backendMessage: string | null
  currentJobId: string | null
  currentError: AppError | null
  statusMessage: string
  stepIndex: number | null
}

export function StatusPanel({
  backendMessage,
  currentJobId,
  currentError,
  statusMessage,
  stepIndex,
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
            <strong>{statusMessage}</strong>
            <span>{backendMessage || 'Waiting for the next action.'}</span>
          </div>
          <div className="status-progress">
            <span className="progress-label">
              {stepIndex === null ? 'Ready' : `${stepIndex + 1} / ${statusSteps.length}`}
            </span>
            <div className="progress-track" aria-hidden="true">
              <span
                className="progress-indicator"
                style={{
                  transform: `scaleX(${stepIndex === null ? 0 : (stepIndex + 1) / statusSteps.length})`,
                }}
              />
            </div>
          </div>
        </div>

        <ol className="step-list">
          {statusSteps.map((step, index) => (
            <li
              className={index <= (stepIndex ?? -1) ? 'step-item step-item--active' : 'step-item'}
              key={step}
            >
              <span>{step}</span>
            </li>
          ))}
        </ol>

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
