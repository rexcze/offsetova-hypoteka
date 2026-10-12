import type { Inputs, SimulationResult } from '../../engine/types.ts'
import { formatAfterYears, formatCzk } from '../format.ts'
import { SCENARIO_LABELS } from '../labels.ts'
import type { Summary } from './summary.ts'

interface Props {
  inputs: Inputs
  result: SimulationResult
  summary: Summary
  showReal: boolean
}

function payoffText(month: number | null): string {
  if (month === null) return 'ne do horizontu'
  if (month === 0) return 'hned na začátku'
  return `měsíc ${month} (${Math.ceil(month / 12)}. rok)`
}

/** Every figure of every scenario at the horizon. */
export function ScenarioTable({ inputs, result, summary, showReal }: Props) {
  const { money } = summary
  return (
    <>
      <p className="mb-2 text-sm text-muted-foreground">
        Stav {formatAfterYears(inputs.horizonYears)}
        {showReal ? ' (v dnešních korunách)' : ''}.
      </p>
      <div className="table-wrap">
        <table className="scenarios" aria-label="Srovnání scénářů">
          <thead>
            <tr>
              <th scope="col">Scénář</th>
              <th scope="col">Čisté jmění</th>
              <th scope="col">Zbývající dluh</th>
              <th scope="col">Likvidní peníze</th>
              <th scope="col">Zaplacené úroky</th>
              <th scope="col">Daňová vratka</th>
              <th scope="col">Čistý úrok ze spoření</th>
              <th scope="col">Poplatky</th>
              <th scope="col">Splaceno</th>
            </tr>
          </thead>
          <tbody>
            {result.ranking.map((id, i) => {
              const s = result.scenarios[id].summary
              return (
                <tr key={id} className={i === 0 ? 'winner' : undefined}>
                  <th scope="row" className={`sc-${id}`}>
                    <span className="swatch" aria-hidden="true" /> {i + 1}. {SCENARIO_LABELS[id]}
                    {i === 0 && <span className="badge">nejlepší</span>}
                    {id === 'D' && (
                      <small className="hint">
                        Úspory nad rezervu ({formatCzk(inputs.prepayment.reserve)}) šly na splátky úvěru, k
                        dispozici je jen rezerva.
                      </small>
                    )}
                  </th>
                  <td data-label="Čisté jmění">
                    <strong>{money(s.netWorth)}</strong>
                  </td>
                  <td data-label="Zbývající dluh">{money(s.debt)}</td>
                  <td data-label="Likvidní peníze">{money(s.liquid)}</td>
                  <td data-label="Zaplacené úroky">{money(s.interestPaid)}</td>
                  <td data-label="Daňová vratka">{money(s.taxRefund)}</td>
                  <td data-label="Čistý úrok ze spoření">{money(s.savingsInterestNet)}</td>
                  <td data-label="Poplatky">{money(s.prepaymentFees)}</td>
                  <td data-label="Splaceno">{payoffText(s.payoffMonth)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
