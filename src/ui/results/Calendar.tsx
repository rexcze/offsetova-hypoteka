import { Fragment, useMemo, useState } from 'react'
import type { MonthRow, ScenarioId, SimulationResult } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'
import { SCENARIO_LABELS } from '../labels.ts'
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

function CellsRow({ c, isOffset }: { c: Cells; isOffset: boolean }) {
  return (
    <>
      <td>{formatCzk(c.payment)}</td>
      <td>{formatCzk(c.interest)}</td>
      <td>{formatCzk(c.principal)}</td>
      <td>{formatCzk(c.prepayment)}</td>
      <td>{formatCzk(c.prepaymentFee)}</td>
      <td>{formatCzk(c.savingsInterestNet)}</td>
      <td>{formatCzk(c.taxRefund)}</td>
      {isOffset && <td>{formatCzk(c.counted)}</td>}
      <td>{formatCzk(c.debt)}</td>
      <td>{formatCzk(c.liquid)}</td>
      <td>{formatCzk(c.netWorth)}</td>
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
    <details className="calendar">
      <summary>Podrobný průběh{showReal ? ' (v dnešních korunách)' : ''}</summary>
      <div role="tablist" aria-label="Scénář" className="tabs">
        {IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={scenario === id}
            aria-controls="calendar-panel"
            className={`sc-${id}`}
            onClick={() => {
              setScenario(id)
              setExpanded(new Set())
            }}
          >
            <span className="swatch" aria-hidden="true" /> {id}: {SCENARIO_LABELS[id]}
          </button>
        ))}
      </div>
      <div id="calendar-panel" role="tabpanel" aria-labelledby={`tab-${scenario}`}>
        <p className="hint">
          Součty za rok a stav na konci roku. Rozbalením roku uvidíte jednotlivé měsíce.
          {isOffset && ' Započteno je průměrná částka na offsetovém účtu, která snižuje úročený dluh.'}
        </p>
        <div className="table-wrap">
          <table
            className="data calendar-table"
            aria-label={`Průběh po letech: ${SCENARIO_LABELS[scenario]}`}
          >
            <thead>
              <tr>
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
                    <tr className="year-row">
                      <th scope="row">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`Rok ${y.year}, ${open ? 'skrýt' : 'zobrazit'} měsíce`}
                          onClick={() => toggle(y.year)}
                        >
                          {open ? '▾' : '▸'} {y.year}
                        </button>
                      </th>
                      <CellsRow c={{ ...y, counted: y.avgCounted }} isOffset={isOffset} />
                    </tr>
                    {open &&
                      y.months.map((m) => (
                        <tr key={m.month} className="month-row">
                          <th scope="row">měsíc {m.month}</th>
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
    </details>
  )
}
