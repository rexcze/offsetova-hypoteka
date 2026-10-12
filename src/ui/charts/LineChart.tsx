import { useEffect, useRef, useState } from 'react'
import type { ScenarioId } from '../../engine/types.ts'
import { formatCompactCzk } from '../format.ts'
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

/** Line style per scenario, so lines differ by more than colour. */
const DASH: Record<ScenarioId, string | undefined> = {
  A: '1 4',
  B: undefined,
  C: '7 4',
  D: '2 3',
}

const MARGIN = { left: 58, right: 14, top: 34, bottom: 28 }

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
    <div className="chart" ref={wrapRef}>
      <ul className="legend">
        {series.map((s) => (
          <li key={s.id} className={`sc-${s.id}`}>
            <svg width="30" height="10" aria-hidden="true">
              <line x1="1" y1="5" x2="29" y2="5" className="line" strokeDasharray={DASH[s.id]} />
            </svg>{' '}
            {s.label}
          </li>
        ))}
      </ul>
      <svg
        role="img"
        aria-label={ariaLabel}
        width={width}
        height={height}
        className="chart-svg"
        onPointerMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect().left)}
        onPointerDown={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect().left)}
        onPointerLeave={() => setHover(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? 'zero' : 'grid'}
            />
            <text x={MARGIN.left - 6} y={y(t)} className="tick" textAnchor="end" dominantBaseline="middle">
              {formatCompactCzk(t)}
            </text>
          </g>
        ))}
        {yearTicks(months).map((m) => (
          <text key={m} x={x(m)} y={height - 8} className="tick" textAnchor="middle">
            {m / 12}
          </text>
        ))}
        <text x={MARGIN.left - 6} y={height - 8} className="tick" textAnchor="end">
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
                className="marker"
              />
              <text
                x={x(mk.month) + (near ? -4 : 4)}
                y={12 + (i % 2) * 12}
                className="marker-label"
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
            className={`line sc-${s.id}`}
            strokeDasharray={DASH[s.id]}
            fill="none"
            d={s.values
              .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`)
              .join('')}
          />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={MARGIN.top + plotH} className="crosshair" />
            {series.map((s) => (
              <circle
                key={s.id}
                cx={x(hover)}
                cy={y(s.values[hover - 1]!)}
                r="4"
                className={`dot sc-${s.id}`}
              />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="tooltip"
          aria-hidden="true"
          style={{ left: x(hover), transform: flip ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}
        >
          <strong>
            Měsíc {hover} ({Math.ceil(hover / 12)}. rok)
          </strong>
          {series.map((s) => (
            <div key={s.id} className={`sc-${s.id}`}>
              <span className="swatch" /> {s.label}: {formatValue(s.values[hover - 1]!)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
