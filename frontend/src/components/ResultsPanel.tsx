import { formatMetricValue } from '../utils/chart'
import type { FileAnalytics } from '../types/job'

type ResultsPanelProps = {
  currentJobResults: FileAnalytics[]
  isRenderingResults: boolean
  selectedReportIndex: number
  onReportSelect: (index: number) => void
}

export function ResultsPanel({
  currentJobResults,
  isRenderingResults,
  selectedReportIndex,
  onReportSelect,
}: ResultsPanelProps) {
  const activeReport = currentJobResults[selectedReportIndex] ?? null

  return (
    <article className="panel panel--results">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Results</p>
          <h2>Statistical results</h2>
        </div>
      </div>

      {currentJobResults.length ? (
        <div className="report-stack">
          <div className="report-tabs" role="tablist" aria-label="Uploaded file reports">
            {currentJobResults.map((report, index) => (
              <button
                className={
                  index === selectedReportIndex ? 'report-tab report-tab--active' : 'report-tab'
                }
                key={report.file_name}
                onClick={() => onReportSelect(index)}
                type="button"
              >
                {report.file_name}
              </button>
            ))}
          </div>

          {activeReport ? (
            <div className="metrics-grid">
              <article className="metric-card">
                <span>Mean</span>
                <strong>{formatMetricValue(activeReport.mean)}</strong>
              </article>
              <article className="metric-card">
                <span>Median</span>
                <strong>{formatMetricValue(activeReport.median)}</strong>
                <small>
                  {activeReport.median_is_approximate ? 'Approximate median' : 'Exact median'}
                </small>
              </article>
              <article className="metric-card">
                <span>Minimum</span>
                <strong>{formatMetricValue(activeReport.min)}</strong>
              </article>
              <article className="metric-card">
                <span>Maximum</span>
                <strong>{formatMetricValue(activeReport.max)}</strong>
              </article>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="empty-copy">
          {isRenderingResults
            ? 'Results are being prepared for display.'
            : 'Processed statistics will appear here after a successful upload.'}
        </p>
      )}
    </article>
  )
}
