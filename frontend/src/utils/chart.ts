import type { ChartPoint } from '../types/job'

export function buildChartPath(points: ChartPoint[]) {
  if (!points.length) {
    return ''
  }

  const minValue = Math.min(...points.map((point) => point.result))
  const maxValue = Math.max(...points.map((point) => point.result))
  const valueRange = maxValue - minValue || 1

  return points
    .map((point, index) => {
      const xPosition = (index / Math.max(points.length - 1, 1)) * 88 + 8
      const normalizedValue = (point.result - minValue) / valueRange
      const yPosition = 94 - normalizedValue * 88
      return `${index === 0 ? 'M' : 'L'} ${xPosition} ${yPosition}`
    })
    .join(' ')
}

export function formatMetricValue(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}
