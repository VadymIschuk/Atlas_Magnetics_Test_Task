import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { ChartPanelProps } from '../types/components'

const chartGridStroke = 'color-mix(in srgb, var(--text-muted) 20%, var(--border))'

const chartTooltipStyle = {
  border: '0.0625rem solid var(--border)',
  borderRadius: '0.75rem',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow)',
}

const chartCursorStyle = {
  stroke: 'var(--accent-dark)',
  strokeDasharray: '4 4',
}

const chartMargin = {
  top: 16,
  right: 16,
  left: 0,
  bottom: 8,
}

const chartDotStyle = {
  fill: 'var(--accent-dark)',
  r: 3,
}

function formatTooltipValue(value: ValueType | undefined) {
  return [value ?? '', 'Result'] as const
}

function formatTooltipLabel(label: string | number, axisField: string) {
  return `${axisField}: ${label}`
}

function renderChartEmptyState() {
  return (
    <div className="chart-empty">
      <strong>Chart placeholder</strong>
      <span>Processed chart data will be rendered here after the backend finishes.</span>
    </div>
  )
}

export function ChartPanel({ activeReport }: ChartPanelProps) {
  const chartData = activeReport?.chart_data ?? []
  const hasChartData = chartData.length > 0
  const chartAxisField = activeReport?.chart_axis_field ?? 'test_id'

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

      {hasChartData ? (
        <div className="chart-shell">
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={chartMargin}>
                <CartesianGrid stroke={chartGridStroke} vertical={false} />
                <XAxis
                  dataKey="x_value"
                  minTickGap={24}
                  stroke="var(--text-muted)"
                  tickLine={false}
                />
                <YAxis
                  dataKey="result"
                  stroke="var(--text-muted)"
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={chartCursorStyle}
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => formatTooltipLabel(label, chartAxisField)}
                />
                <Line
                  dataKey="result"
                  dot={chartDotStyle}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        renderChartEmptyState()
      )}
    </article>
  )
}
