import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Inputs, SimulationResult } from '../../engine/types.ts'
import { formatAfterYears, formatCzk } from '../format.ts'
import { SCENARIO_DOT, SCENARIO_LABELS } from '../labels.ts'
import type { Summary } from './summary.ts'

interface Props {
  inputs: Inputs
  result: SimulationResult
  summary: Summary
  showReal: boolean
}

/** Cells: right-aligned; on narrow screens every row becomes a card and the label comes from data-label. */
const CELL =
  'px-2 py-2 text-right align-top whitespace-nowrap tabular-nums max-md:flex max-md:justify-between max-md:gap-4 max-md:before:text-left max-md:before:text-muted-foreground max-md:before:content-[attr(data-label)]'

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
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-sm md:min-w-[44rem] max-md:block"
          aria-label="Srovnání scénářů"
        >
          <thead className="max-md:sr-only">
            <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-right [&>th]:font-medium [&>th]:text-muted-foreground [&>th:first-child]:text-left">
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
          <tbody className="max-md:block">
            {result.ranking.map((id, i) => {
              const s = result.scenarios[id].summary
              return (
                <tr
                  key={id}
                  className={cn(
                    'border-t max-md:mb-3 max-md:block max-md:rounded-lg max-md:border',
                    i === 0 && 'bg-primary/10',
                  )}
                >
                  <th scope="row" className="px-2 py-2 text-left align-top font-medium max-md:block">
                    <span
                      aria-hidden="true"
                      className={cn('mr-1.5 inline-block size-2.5 rounded-full', SCENARIO_DOT[id])}
                    />{' '}
                    {i + 1}. {SCENARIO_LABELS[id]}
                    {i === 0 && (
                      <Badge variant="secondary" className="ml-2 align-middle">
                        nejlepší
                      </Badge>
                    )}
                    {id === 'D' && (
                      <small className="mt-1 block text-xs font-normal text-muted-foreground">
                        Úspory nad rezervu ({formatCzk(inputs.prepayment.reserve)}) šly na splátky úvěru, k
                        dispozici je jen rezerva.
                      </small>
                    )}
                  </th>
                  <td data-label="Čisté jmění" className={CELL}>
                    <strong>{money(s.netWorth)}</strong>
                  </td>
                  <td data-label="Zbývající dluh" className={CELL}>
                    {money(s.debt)}
                  </td>
                  <td data-label="Likvidní peníze" className={CELL}>
                    {money(s.liquid)}
                  </td>
                  <td data-label="Zaplacené úroky" className={CELL}>
                    {money(s.interestPaid)}
                  </td>
                  <td data-label="Daňová vratka" className={CELL}>
                    {money(s.taxRefund)}
                  </td>
                  <td data-label="Čistý úrok ze spoření" className={CELL}>
                    {money(s.savingsInterestNet)}
                  </td>
                  <td data-label="Poplatky" className={CELL}>
                    {money(s.prepaymentFees)}
                  </td>
                  <td data-label="Splaceno" className={CELL}>
                    {payoffText(s.payoffMonth)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
