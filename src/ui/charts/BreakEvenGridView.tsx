import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
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

  /** Cell colour: the more it wins or loses, the stronger the tint (45 % at most, to keep the text readable). */
  const tint = (kind: 'win' | 'lose', v: number) =>
    `color-mix(in srgb, var(--result-${kind}) ${Math.round(10 + Math.min(1, Math.abs(v) / maxAbs) * 35)}%, transparent)`

  return (
    <Card className="gap-0 py-5">
      <CardHeader className="px-5 pb-3">
        <h2 className="font-semibold">
          Od kolika úspor se offset vyplatí{showReal ? ' (v dnešních korunách)' : ''}
        </h2>
        <p className="text-sm text-muted-foreground">
          Kolik byste získali (nebo ztratili) offsetem proti nejlepší jiné variantě.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <li className="flex items-center gap-1.5">
            <span
              className="grid size-5 place-items-center rounded font-bold"
              style={{ backgroundColor: tint('win', maxAbs) }}
            >
              +
            </span>
            offset vyhrává
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="grid size-5 place-items-center rounded font-bold"
              style={{ backgroundColor: tint('lose', maxAbs) }}
            >
              {'\u2212'}
            </span>
            vyhrává jiná varianta
          </li>
          <li className="flex items-center gap-1.5">
            <span className="grid size-5 place-items-center rounded bg-muted font-bold text-muted-foreground">
              ·
            </span>
            zhruba stejně
          </li>
          <li className="flex items-center gap-1.5">
            <span className="grid size-5 place-items-center rounded outline-[3px] -outline-offset-[3px] outline-foreground">
              &nbsp;
            </span>
            nejblíž vašemu zadání
          </li>
        </ul>
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[34rem] table-fixed border-separate border-spacing-0.5 text-xs"
            aria-label={ariaLabel}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  className="w-24 p-0 text-left text-[10px] leading-tight font-normal text-muted-foreground"
                >
                  přirážka ↓ / úspory (tis. Kč) →
                </th>
                {grid.savings.map((s) => (
                  <th scope="col" key={s} className="p-0 text-center font-medium text-muted-foreground">
                    {Math.round(s / 1000)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.surcharges.map((sur, iy) => (
                <tr key={sur}>
                  <th
                    scope="row"
                    className="p-0 text-left font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {surchargeText(sur)}
                  </th>
                  {values[iy]!.map((v, ix) => {
                    const kind = Math.abs(v) < neutral ? 'neutral' : v > 0 ? 'win' : 'lose'
                    const isCurrent = current?.iy === iy && current.ix === ix
                    return (
                      <td
                        key={ix}
                        className={cn(
                          'h-8 cursor-pointer rounded-md p-0 text-center font-bold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
                          kind === 'neutral' && 'bg-muted text-muted-foreground',
                          isCurrent && 'current outline-[3px] -outline-offset-[3px] outline-foreground',
                        )}
                        style={kind === 'neutral' ? undefined : { backgroundColor: tint(kind, v) }}
                        title={describe(iy, ix)}
                        tabIndex={0}
                        onMouseEnter={() => setActive({ iy, ix })}
                        onMouseLeave={() => setActive(null)}
                        onFocus={() => setActive({ iy, ix })}
                        onBlur={() => setActive(null)}
                        onClick={() => setActive({ iy, ix })}
                      >
                        {kind === 'win' ? '+' : kind === 'lose' ? '\u2212' : '·'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="min-h-10 text-sm" aria-live="polite">
          {shown ? describe(shown.iy, shown.ix) : 'Najeďte na buňku nebo na ni klepněte.'}
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Data mřížky</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th scope="col" className="py-1 pr-3 text-left font-medium">
                    Přirážka / úspory
                  </th>
                  {grid.savings.map((s) => (
                    <th scope="col" key={s} className="px-2 py-1 text-right font-medium whitespace-nowrap">
                      {formatCzk(s)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.surcharges.map((sur, iy) => (
                  <tr key={sur} className="border-t">
                    <th scope="row" className="py-1 pr-3 text-left font-normal whitespace-nowrap">
                      {surchargeText(sur)}
                    </th>
                    {values[iy]!.map((v, ix) => (
                      <td key={ix} className="px-2 py-1 text-right whitespace-nowrap tabular-nums">
                        {formatCzk(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
