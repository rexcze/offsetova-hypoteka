import { useMemo, useState } from 'react'
import { breakEvenGrid, toReal } from '../../engine/analysis.ts'
import type { Inputs } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'

interface Props {
  inputs: Inputs
  showReal: boolean
}

function surchargeText(surcharge: number): string {
  return `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(surcharge * 100)} p. b.`
}

export function BreakEvenGridView({ inputs, showReal }: Props) {
  const grid = useMemo(() => breakEvenGrid(inputs), [inputs])
  const [active, setActive] = useState<{ iy: number; ix: number } | null>(null)
  const months = inputs.horizonYears * 12

  const values = grid.values.map((row) =>
    row.map((v) => (showReal ? toReal(v, months, inputs.inflation) : v)),
  )
  const maxAbs = Math.max(1, ...values.flat().map(Math.abs))
  const neutral = maxAbs * 0.02

  // Cell closest to the current inputs, if they lie inside the grid.
  const stepX = grid.savings[1]! - grid.savings[0]!
  const currentX = stepX > 0 ? Math.round(inputs.savings.initial / stepX) : -1
  const currentY = Math.round(((inputs.loan.offsetRate - inputs.loan.classicRate) / 0.01) * 10)
  const inGrid = (i: number) => i >= 0 && i <= 10
  const current = inGrid(currentX) && inGrid(currentY) ? { iy: currentY, ix: currentX } : null

  const describe = (iy: number, ix: number) => {
    const v = values[iy]![ix]!
    const outcome =
      Math.abs(v) < neutral
        ? 'vychází zhruba stejně'
        : v > 0
          ? `offset vyhrává o ${formatCzk(v)}`
          : `nejlepší jiná varianta vyhrává o ${formatCzk(-v)}`
    return `Počáteční úspory ${formatCzk(grid.savings[ix]!)}, přirážka ${surchargeText(grid.surcharges[iy]!)}: ${outcome}.`
  }

  const winning = values.flat().filter((v) => v >= neutral).length
  const ariaLabel = `Mřížka bodu zvratu: offset vyhrává v ${winning} ze ${values.flat().length} kombinací počátečních úspor a přirážky.`
  const shown = active ?? current

  return (
    <section className="chart-section">
      <h2>Od jakých úspor se offset vyplatí{showReal ? ' (v dnešních korunách)' : ''}</h2>
      <p className="hint">Kolik byste získali (nebo ztratili) offsetem proti nejlepší jiné variantě.</p>
      <ul className="legend grid-legend">
        <li>
          <span className="cell-sample win">+</span> offset vyhrává
        </li>
        <li>
          <span className="cell-sample lose">−</span> vyhrává jiná varianta
        </li>
        <li>
          <span className="cell-sample neutral">·</span> zhruba stejně
        </li>
        <li>
          <span className="cell-sample current">▢</span> nejblíž vašemu zadání
        </li>
      </ul>
      <div className="table-wrap">
        <table className="break-even" aria-label={ariaLabel}>
          <thead>
            <tr>
              <th scope="col" className="corner">
                přirážka ↓ / úspory (tis. Kč) →
              </th>
              {grid.savings.map((s) => (
                <th scope="col" key={s}>
                  {Math.round(s / 1000)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.surcharges.map((sur, iy) => (
              <tr key={sur}>
                <th scope="row">{surchargeText(sur)}</th>
                {values[iy]!.map((v, ix) => {
                  const kind = Math.abs(v) < neutral ? 'neutral' : v > 0 ? 'win' : 'lose'
                  const isCurrent = current?.iy === iy && current.ix === ix
                  return (
                    <td
                      key={ix}
                      className={`${kind}${isCurrent ? ' current' : ''}`}
                      style={{ ['--i' as string]: Math.min(1, Math.abs(v) / maxAbs) }}
                      title={describe(iy, ix)}
                      tabIndex={0}
                      onMouseEnter={() => setActive({ iy, ix })}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive({ iy, ix })}
                      onBlur={() => setActive(null)}
                      onClick={() => setActive({ iy, ix })}
                    >
                      {kind === 'win' ? '+' : kind === 'lose' ? '−' : '·'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="readout" aria-live="polite">
        {shown ? describe(shown.iy, shown.ix) : 'Najeďte na buňku nebo na ni klepněte.'}
      </p>
      <details>
        <summary>Data mřížky</summary>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Přirážka / úspory</th>
                {grid.savings.map((s) => (
                  <th scope="col" key={s}>
                    {formatCzk(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.surcharges.map((sur, iy) => (
                <tr key={sur}>
                  <th scope="row">{surchargeText(sur)}</th>
                  {values[iy]!.map((v, ix) => (
                    <td key={ix}>{formatCzk(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
