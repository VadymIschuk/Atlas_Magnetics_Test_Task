import { MetricCard } from './MetricCard'
import type { ResultsPanelProps } from '../types/components'

function formatMetricValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

export function ResultsPanel({
  activeReport,
  jobResults,
  isRenderingResults,
  selectedReportIndex,
  onReportSelect,
}: ResultsPanelProps) {
  const metrics = activeReport
    ? [
        {
          label: 'Mean',
          value: formatMetricValue(activeReport.mean),
        },
        {
          label: 'Median',
          value: formatMetricValue(activeReport.median),
          hint: activeReport.median_is_approximate ? 'Approximate median' : 'Exact median',
        },
        {
          label: 'Minimum',
          value: formatMetricValue(activeReport.min),
        },
        {
          label: 'Maximum',
          value: formatMetricValue(activeReport.max),
        },
      ]
    : []

  return (
    <article className="dashboard-panel panel--results">
      <div className="dashboard-section-header">
        <div>
          <p className="eyebrow">Results</p>
          <h2>Statistical results</h2>
        </div>
      </div>

      {jobResults.length ? (
        <div className="report-content">
          <div className="report-tabs" role="tablist" aria-label="Uploaded file reports">
            {jobResults.map((report, index) => (
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
              {metrics.map((metric) => (
                <MetricCard
                  hint={metric.hint}
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
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
