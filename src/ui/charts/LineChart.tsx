import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ScenarioId } from '../../engine/types.ts'
import { SCENARIO_DASH, SCENARIO_DOT, SCENARIO_STROKE, SCENARIO_FILL } from '../labels.ts'
import { niceTicks, yearTicks } from './scale.ts'

export interface Series {
  id: ScenarioId
  label: string
  /** Value for month 1 … months. */
  values: number[]
}

export interface Marker {
  month: number
  label: string
}

interface Props {
  series: Series[]
  months: number
  markers: Marker[]
  ariaLabel: string
  formatValue: (value: number) => string
}

const MARGIN = { left: 52, right: 14, top: 34, bottom: 28 }

const thousands = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })

/** Axis label in thousands of CZK with a real minus sign. */
const axisLabel = (value: number) => {
  const k = Math.round(value / 1000)
  return k === 0 ? '0' : `${k < 0 ? '−' : ''}${thousands.format(Math.abs(k))}`
}

/** Line chart of the advantage over time; theme colours, one line style per scenario. */
export function LineChart({ series, months, markers, ariaLabel, formatValue }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => setWidth(Math.max(260, el.clientWidth)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const height = Math.round(Math.min(340, Math.max(230, width * 0.55)))
  const plotW = width - MARGIN.left - MARGIN.right
  const plotH = height - MARGIN.top - MARGIN.bottom

  const all = series.flatMap((s) => s.values)
  const yTicks = niceTicks(Math.min(0, ...all), Math.max(0, ...all))
  const y0 = yTicks[0]!
  const y1 = yTicks[yTicks.length - 1]!
  const x = (m: number) => MARGIN.left + ((m - 1) / Math.max(1, months - 1)) * plotW
  const y = (v: number) => MARGIN.top + (1 - (v - y0) / (y1 - y0)) * plotH

  const onMove = (clientX: number, left: number) => {
    const m = Math.round(1 + ((clientX - left - MARGIN.left) / plotW) * (months - 1))
    setHover(Math.min(months, Math.max(1, m)))
  }

  const flip = hover !== null && x(hover) > width / 2

  return (
    <div className="relative" ref={wrapRef}>
      <svg
        role="img"
        aria-label={ariaLabel}
        width={width}
        height={height}
        className="block max-w-full touch-pan-y"
        onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect().left)}
        onPointerDown={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect().left)}
        onPointerLeave={() => setHover(null)}
      >
        <text x={0} y={MARGIN.top - 14} className="fill-muted-foreground text-[11px]">
          tis. Kč
        </text>
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? 'stroke-muted-foreground' : 'stroke-border'}
              strokeWidth={t === 0 ? 1.5 : 1}
            />
            <text
              x={MARGIN.left - 6}
              y={y(t)}
              className="fill-muted-foreground text-[11px]"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {axisLabel(t)}
            </text>
          </g>
        ))}
        {yearTicks(months).map((m) => (
          <text
            key={m}
            x={x(m)}
            y={height - 8}
            className="fill-muted-foreground text-[11px]"
            textAnchor="middle"
          >
            {m / 12}
          </text>
        ))}
        <text
          x={MARGIN.left - 6}
          y={height - 8}
          className="fill-muted-foreground text-[11px]"
          textAnchor="end"
        >
          roky
        </text>
        {markers.map((mk, i) => {
          const near = x(mk.month) > width - 110
          return (
            <g key={`${mk.month}-${mk.label}`}>
              <line
                x1={x(mk.month)}
                x2={x(mk.month)}
                y1={MARGIN.top - 4}
                y2={MARGIN.top + plotH}
                className="stroke-muted-foreground"
                strokeDasharray="4 3"
              />
              <text
                x={x(mk.month) + (near ? -4 : 4)}
                y={12 + (i % 2) * 12}
                className="fill-foreground text-[11px]"
                textAnchor={near ? 'end' : 'start'}
              >
                {mk.label}
              </text>
            </g>
          )
        })}
        {series.map((s) => (
          <path
            key={s.id}
            data-scenario={s.id}
            className={SCENARIO_STROKE[s.id]}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={SCENARIO_DASH[s.id]}
            fill="none"
            d={s.values
              .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`)
              .join('')}
          />
        ))}
        {hover !== null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotH}
              className="stroke-muted-foreground"
            />
            {series.map((s) => (
              <circle
                key={s.id}
                cx={x(hover)}
                cy={y(s.values[hover - 1]!)}
                r="4"
                strokeWidth={1.5}
                className={cn('stroke-card', SCENARIO_FILL[s.id])}
              />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 z-10 w-max max-w-64 rounded-md border bg-popover px-2.5 py-2 text-xs leading-snug text-popover-foreground shadow-md"
          style={{ left: x(hover), transform: flip ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}
        >
          <strong>
            Měsíc {hover} ({Math.ceil(hover / 12)}. rok)
          </strong>
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', SCENARIO_DOT[s.id])} />
              {s.label}: {formatValue(s.values[hover - 1]!)}
            </div>
          ))}
        </div>
      )}
      <ul aria-label="Legenda grafu" className="mt-2 flex flex-wrap gap-2 text-xs">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-full border px-2.5 py-1">
            <svg width="28" height="8" aria-hidden="true">
              <line
                x1="2"
                y1="4"
                x2="26"
                y2="4"
                data-legend-line={s.id}
                className={SCENARIO_STROKE[s.id]}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={SCENARIO_DASH[s.id]}
              />
            </svg>
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
