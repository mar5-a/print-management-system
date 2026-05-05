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
  top: 22,
  right: 22,
  bottom: 58,
  left: 58,
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
      <div className="flex items-center justify-between gap-4 border-b border-line bg-mist-50/80 px-5 py-4">
        <div className="text-base font-semibold text-ink-950">Print activity</div>

        <div className="flex border border-line bg-white p-0.5">
          <RangeButton active={range === 'week'} onClick={() => setRange('week')}>
            Last 7 days
          </RangeButton>
          <RangeButton active={range === 'month'} onClick={() => setRange('month')}>
            Last 30 days
          </RangeButton>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="rounded-none border border-line bg-white p-4">
          {error ? (
            <div className="flex h-[21rem] items-center justify-center text-sm text-danger-500">{error}</div>
          ) : isLoading && !activity ? (
            <div className="flex h-[21rem] items-center justify-center text-sm text-slate-500">
              Loading print activity...
            </div>
          ) : (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[21rem] w-full" role="img">
              <title>Printed pages over the selected date range</title>

              {chart.yTicks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={chartPadding.left}
                    x2={chartWidth - chartPadding.right}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="#e7edf3"
                  />
                  <text
                    x={chartPadding.left - 12}
                    y={tick.y + 4}
                    textAnchor="end"
                    className="fill-slate-500 font-mono text-[0.68rem]"
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
                stroke="#dbe6ef"
              />
              <line
                x1={chartPadding.left}
                x2={chartWidth - chartPadding.right}
                y1={chartHeight - chartPadding.bottom}
                y2={chartHeight - chartPadding.bottom}
                stroke="#dbe6ef"
              />

              <polyline fill="none" points={chart.polylinePoints} stroke="#43a047" strokeWidth="3" />

              {chart.points.map((point) => (
                <circle key={point.key} cx={point.x} cy={point.y} r="3.5" fill="#43a047" />
              ))}

              {chart.xLabels.map((label) => (
                <text
                  key={label.key}
                  x={label.x}
                  y={chartHeight - 20}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[0.68rem]"
                >
                  {label.text}
                </text>
              ))}

              <text
                x="16"
                y={chartPadding.top + 8}
                textAnchor="start"
                className="fill-slate-500 font-mono text-[0.68rem] uppercase"
              >
                Pages
              </text>
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
          ? 'bg-accent-600 px-3 py-1.5 text-sm font-medium text-white'
          : 'px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-mist-50'
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

  return {
    points: chartPoints,
    polylinePoints: chartPoints.map((point) => `${point.x},${point.y}`).join(' '),
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
