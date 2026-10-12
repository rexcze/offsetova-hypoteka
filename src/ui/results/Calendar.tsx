import { Fragment, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MonthRow, ScenarioId, SimulationResult } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'
import { SCENARIO_DOT, SCENARIO_LABELS } from '../labels.ts'
import { aggregateYears } from './calendar.ts'

interface Props {
  result: SimulationResult
  inflation: number
  showReal: boolean
}

const IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

interface Cells {
  payment: number
  interest: number
  principal: number
  prepayment: number
  prepaymentFee: number
  savingsInterestNet: number
  taxRefund: number
  counted: number
  debt: number
  liquid: number
  netWorth: number
}

const CELL = 'px-2 py-1 text-right whitespace-nowrap tabular-nums'

function CellsRow({ c, isOffset }: { c: Cells; isOffset: boolean }) {
  return (
    <>
      <td className={CELL}>{formatCzk(c.payment)}</td>
      <td className={CELL}>{formatCzk(c.interest)}</td>
      <td className={CELL}>{formatCzk(c.principal)}</td>
      <td className={CELL}>{formatCzk(c.prepayment)}</td>
      <td className={CELL}>{formatCzk(c.prepaymentFee)}</td>
      <td className={CELL}>{formatCzk(c.savingsInterestNet)}</td>
      <td className={CELL}>{formatCzk(c.taxRefund)}</td>
      {isOffset && <td className={CELL}>{formatCzk(c.counted)}</td>}
      <td className={CELL}>{formatCzk(c.debt)}</td>
      <td className={CELL}>{formatCzk(c.liquid)}</td>
      <td className={CELL}>{formatCzk(c.netWorth)}</td>
    </>
  )
}

const monthCells = (r: MonthRow): Cells => r

export function Calendar({ result, inflation, showReal }: Props) {
  const [scenario, setScenario] = useState<ScenarioId>('B')
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set())
  const years = useMemo(
    () => aggregateYears(result.scenarios[scenario].rows, inflation, showReal),
    [result, scenario, inflation, showReal],
  )
  const isOffset = scenario === 'B'

  const toggle = (year: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (!next.delete(year)) next.add(year)
      return next
    })

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Scénář" className="flex flex-wrap gap-2">
        {IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={scenario === id}
            aria-controls="calendar-panel"
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm hover:bg-accent aria-selected:border-primary aria-selected:bg-accent aria-selected:font-semibold"
            onClick={() => {
              setScenario(id)
              setExpanded(new Set())
            }}
          >
            <span aria-hidden="true" className={cn('size-2.5 shrink-0 rounded-full', SCENARIO_DOT[id])} />
            {id}: {SCENARIO_LABELS[id]}
          </button>
        ))}
      </div>
      <div id="calendar-panel" role="tabpanel" aria-labelledby={`tab-${scenario}`} className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Součty za rok a stav na konci roku. Rozbalením roku uvidíte jednotlivé měsíce.
          {isOffset && ' Započteno je průměrná částka na offsetovém účtu, která snižuje úročený dluh.'}
        </p>
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-xs"
            aria-label={`Průběh po letech: ${SCENARIO_LABELS[scenario]}`}
          >
            <thead>
              <tr className="[&>th]:px-2 [&>th]:py-1 [&>th]:text-right [&>th]:font-medium [&>th:first-child]:text-left">
                <th scope="col">Rok</th>
                <th scope="col">Splátky</th>
                <th scope="col">Úroky</th>
                <th scope="col">Jistina</th>
                <th scope="col">Mimořádné splátky</th>
                <th scope="col">Poplatky</th>
                <th scope="col">Úrok ze spoření</th>
                <th scope="col">Daňová vratka</th>
                {isOffset && <th scope="col">Průměrně započteno</th>}
                <th scope="col">Dluh na konci</th>
                <th scope="col">Likvidní peníze na konci</th>
                <th scope="col">Čisté jmění na konci</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => {
                const open = expanded.has(y.year)
                return (
                  <Fragment key={y.year}>
                    <tr className="border-t">
                      <th scope="row" className="py-1 pr-2 text-left font-normal">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          aria-expanded={open}
                          aria-label={`Rok ${y.year}, ${open ? 'skrýt' : 'zobrazit'} měsíce`}
                          onClick={() => toggle(y.year)}
                        >
                          {open ? '▾' : '▸'} {y.year}
                        </Button>
                      </th>
                      <CellsRow c={{ ...y, counted: y.avgCounted }} isOffset={isOffset} />
                    </tr>
                    {open &&
                      y.months.map((m) => (
                        <tr key={m.month} className="border-t text-muted-foreground">
                          <th scope="row" className="py-1 pr-2 pl-6 text-left font-normal">
                            měsíc {m.month}
                          </th>
                          <CellsRow c={monthCells(m)} isOffset={isOffset} />
                        </tr>
                      ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
