import { toReal } from '../../engine/analysis.ts'
import type { Inputs, ScenarioId, SimulationResult } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'

/** The verdict numbers shared by the verdict card, the scenario cards and the sticky summary bar. */
export function summarize(inputs: Inputs, result: SimulationResult, showReal: boolean) {
  const months = inputs.horizonYears * 12
  /** Converts a nominal amount at the horizon to today's CZK when asked. */
  const convert = (nominal: number) => (showReal ? toReal(nominal, months, inputs.inflation) : nominal)
  const netWorth = (id: ScenarioId) => result.scenarios[id].summary.netWorth
  const [winner, second] = result.ranking as [ScenarioId, ScenarioId]
  return {
    winner,
    second,
    /** Lead of the winner over the second scenario, never negative; already in the chosen terms (do not convert again). */
    lead: Math.abs(convert(netWorth(winner)) - convert(netWorth(second))),
    tie: Math.round(netWorth(winner) * 100) === Math.round(netWorth(second) * 100),
    /** Advantage of a scenario over money on the current account (scenario A). */
    advantageOverA: (id: ScenarioId) => convert(netWorth(id) - netWorth('A')),
    offsetVsSavings: netWorth('B') - netWorth('C'),
    money: (nominal: number) => formatCzk(convert(nominal)),
  }
}

export type Summary = ReturnType<typeof summarize>

/** "+119 567 Kč", "−12 345 Kč" (real minus sign) or "0 Kč" for an amount that rounds to zero. */
export function formatSigned(value: number): string {
  const rounded = Math.round(value)
  if (rounded === 0) return formatCzk(0)
  return `${rounded < 0 ? '−' : '+'}${formatCzk(Math.abs(rounded))}`
}
