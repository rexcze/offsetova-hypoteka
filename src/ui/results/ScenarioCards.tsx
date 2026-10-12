import { ShieldCheck, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Inputs, SimulationResult } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'
import { SCENARIO_BADGE, SCENARIO_BORDER, SCENARIO_DOT, SCENARIO_SHORT } from '../labels.ts'
import { formatSigned, type Summary } from './summary.ts'

interface Props {
  inputs: Inputs
  result: SimulationResult
  summary: Summary
}

/** The four scenarios as cards in ranking order, with the advantage over money on the current account. */
export function ScenarioCards({ inputs, result, summary }: Props) {
  return (
    <ol aria-label="Pořadí scénářů" className="grid grid-cols-1 gap-4 @md:grid-cols-2">
      {result.ranking.map((id, i) => {
        const winner = i === 0
        return (
          <li
            key={id}
            data-winner={winner ? 'true' : undefined}
            className={cn(
              'rounded-xl bg-card p-4 shadow-sm',
              winner ? cn('border-2', SCENARIO_BORDER[id]) : 'border',
            )}
          >
            <div className="flex items-center justify-between">
              <span aria-hidden="true" className={cn('size-2.5 rounded-full', SCENARIO_DOT[id])} />
              {winner ? (
                <Badge variant="secondary" className={cn('text-foreground', SCENARIO_BADGE[id])}>
                  {i + 1}. místo
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">{i + 1}. místo</span>
              )}
            </div>
            <h3 className="mt-2 text-sm font-medium">{SCENARIO_SHORT[id]}</h3>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatSigned(summary.advantageOverA(id))}</p>
            <p className="text-xs text-muted-foreground">
              {id === 'A' ? 'výchozí srovnání' : 'oproti penězům na běžném účtu'}
            </p>
            {id === 'D' ? (
              <p className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                <Wallet aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />K dispozici jen{' '}
                {formatCzk(inputs.prepayment.reserve)} rezerva.
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-1.5 rounded-md bg-emerald-50 p-2 text-xs text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                Peníze zůstávají k dispozici.
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
