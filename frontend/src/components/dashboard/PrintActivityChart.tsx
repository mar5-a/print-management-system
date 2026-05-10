import { useEffect, useMemo, useState } from 'react'
import {
  getPrintActivity,
  type PrintActivityRange,
  type PrintActivitySnapshot,
} from '@/features/admin/dashboard/api'

const refreshIntervalMs = 60_000
const chartWidth = 840
const chartHeight = 320
const chartPadding = {
  top: 20,
  right: 22,
  bottom: 48,
  left: 54,
}

export function PrintActivityChart() {
  const [range, setRange] = useState<PrintActivityRange>('week')
  const [activity, setActivity] = useState<PrintActivitySnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      try {
        const nextActivity = await getPrintActivity(range)

        if (isMounted) {
          setActivity(nextActivity)
          setError(null)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load print activity.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadActivity()

    const interval = window.setInterval(() => {
      void loadActivity()
    }, refreshIntervalMs)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [range])

  const chart = useMemo(() => buildChart(activity), [activity])

  return (
    <section className="ui-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-info-100/65 px-4 py-3.5">
        <div>
          <div className="text-base font-semibold text-ink-950">Print activity</div>
          <div className="mt-1 text-xs text-slate-500">{activity ? `${activity.totalPages.toLocaleString()} pages in selected range` : 'Pages submitted by period'}</div>
        </div>

        <div className="flex rounded-xl border border-line bg-panel p-0.5">
          <RangeButton active={range === 'week'} onClick={() => setRange('week')}>
            Week
          </RangeButton>
          <RangeButton active={range === 'month'} onClick={() => setRange('month')}>
            Month
          </RangeButton>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="rounded-xl border border-line bg-panel p-3.5">
          {error ? (
            <div className="flex h-[19rem] items-center justify-center text-sm text-danger-500">{error}</div>
          ) : isLoading && !activity ? (
            <div className="flex h-[19rem] items-center justify-center text-sm text-slate-500">
              Loading print activity...
            </div>
          ) : (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[19rem] w-full" role="img">
              <title>Printed pages over the selected date range</title>

              {chart.yTicks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={chartPadding.left}
                    x2={chartWidth - chartPadding.right}
                    y1={tick.y}
                    y2={tick.y}
                    style={{ stroke: 'var(--color-line)' }}
                  />
                  <text
                    x={chartPadding.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[0.65rem]"
                  >
                    {tick.value}
                  </text>
                </g>
              ))}

              <line
                x1={chartPadding.left}
                x2={chartPadding.left}
                y1={chartPadding.top}
                y2={chartHeight - chartPadding.bottom}
                style={{ stroke: 'var(--color-line)' }}
              />
              <line
                x1={chartPadding.left}
                x2={chartWidth - chartPadding.right}
                y1={chartHeight - chartPadding.bottom}
                y2={chartHeight - chartPadding.bottom}
                style={{ stroke: 'var(--color-line)' }}
              />

              <path d={chart.areaPath} fill="url(#activityAreaGradient)" opacity="0.8" />
              <polyline fill="none" points={chart.polylinePoints} stroke="var(--color-accent-600)" strokeWidth="3" />

              {chart.points.map((point) => (
                <circle key={point.key} cx={point.x} cy={point.y} r="3.4" fill="var(--color-accent-600)" />
              ))}

              {chart.xLabels.map((label) => (
                <text
                  key={label.key}
                  x={label.x}
                  y={chartHeight - 14}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[0.65rem]"
                >
                  {label.text}
                </text>
              ))}

              <defs>
                <linearGradient id="activityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent-500)" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="var(--color-accent-500)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
      </div>
    </section>
  )
}

function RangeButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      className={
        active
          ? 'rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white'
          : 'rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-mist-50'
      }
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function buildChart(activity: PrintActivitySnapshot | null) {
  const points = activity?.points ?? []
  const values = points.map((point) => point.pages)
  const maxPages = Math.max(...values, 0)
  const yMax = getNiceMax(maxPages)
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom

  const chartPoints = points.map((point, index) => {
    const x = chartPadding.left + (index / Math.max(points.length - 1, 1)) * plotWidth
    const y = chartPadding.top + plotHeight - (point.pages / yMax) * plotHeight

    return {
      key: point.date,
      x,
      y,
      label: point.label,
    }
  })

  const areaPath =
    chartPoints.length > 0
      ? [
          `M ${chartPoints[0].x} ${chartHeight - chartPadding.bottom}`,
          ...chartPoints.map((point) => `L ${point.x} ${point.y}`),
          `L ${chartPoints[chartPoints.length - 1].x} ${chartHeight - chartPadding.bottom}`,
          'Z',
        ].join(' ')
      : ''

  return {
    points: chartPoints,
    polylinePoints: chartPoints.map((point) => `${point.x},${point.y}`).join(' '),
    areaPath,
    xLabels: chartPoints
      .filter((_, index) => shouldShowDateLabel(index, chartPoints.length, activity?.range ?? 'week'))
      .map((point) => ({
        key: point.key,
        x: point.x,
        text: point.label,
      })),
    yTicks: Array.from({ length: 6 }, (_, index) => {
      const value = Math.round(yMax - (yMax / 5) * index)
      const y = chartPadding.top + (plotHeight / 5) * index

      return { value, y }
    }),
  }
}

function shouldShowDateLabel(index: number, length: number, range: PrintActivityRange) {
  if (range === 'week') {
    return true
  }

  return index === 0 || index === length - 1 || index % 3 === 0
}

function getNiceMax(value: number) {
  if (value <= 0) {
    return 10
  }

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10

  return niceNormalized * magnitude
}
