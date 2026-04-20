import type { FileAnalytics } from '../types/job'
import { buildChartPath } from '../utils/chart'

type ChartPanelProps = {
  activeReport: FileAnalytics | null
}

export function ChartPanel({ activeReport }: ChartPanelProps) {
  return (
    <article className="panel panel--chart">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Chart</p>
          <h2>Chart area</h2>
        </div>
        {activeReport ? (
          <span className="chart-axis">
            X-axis: {activeReport.chart_axis_field} / Y-axis: result
          </span>
        ) : null}
      </div>

      {activeReport?.chart_data.length ? (
        <div className="chart-shell">
          <svg
            aria-label="Result chart"
            className="chart-svg"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <line className="chart-axis-line" x1="8" x2="8" y1="6" y2="94" />
            <line className="chart-axis-line" x1="8" x2="96" y1="94" y2="94" />
            <path className="chart-line" d={buildChartPath(activeReport.chart_data)} />
            {activeReport.chart_data.map((point, index, collection) => {
              const minValue = Math.min(...collection.map((item) => item.result))
              const maxValue = Math.max(...collection.map((item) => item.result))
              const range = maxValue - minValue || 1
              const xPosition = (index / Math.max(collection.length - 1, 1)) * 88 + 8
              const yPosition = 94 - ((point.result - minValue) / range) * 88

              return (
                <circle
                  className="chart-point"
                  cx={xPosition}
                  cy={yPosition}
                  key={`${point.x_value}-${index}`}
                  r="1.2"
                />
              )
            })}
          </svg>

          <div className="chart-labels">
            {activeReport.chart_data.slice(0, 6).map((point) => (
              <span key={`${point.x_value}-${point.result}`}>{point.x_value}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="chart-empty">
          <strong>Chart placeholder</strong>
          <span>Processed chart data will be rendered here after the backend finishes.</span>
        </div>
      )}
    </article>
  )
}
