import { marginalSavingsRate } from './savings.ts'
import { simulate } from './simulate.ts'
import type { Inputs, ScenarioId, SimulationResult } from './types.ts'

type Alternative = 'B' | 'C' | 'D'

/** Net worth of B, C and D minus net worth of A, per month (index 0 = month 1). */
export function advantageOverA(result: SimulationResult): Record<Alternative, number[]> {
  const a = result.scenarios.A.rows
  const diff = (id: Alternative) => result.scenarios[id].rows.map((r, i) => r.netWorth - a[i]!.netWorth)
  return { B: diff('B'), C: diff('C'), D: diff('D') }
}

/** Months (numbered from 1) where the sign changes against the last non-zero sign. */
export function crossovers(diff: number[]): number[] {
  const months: number[] = []
  let last = 0
  diff.forEach((value, i) => {
    const sign = Math.sign(value)
    if (sign === 0) return
    if (last !== 0 && sign !== last) months.push(i + 1)
    last = sign
  })
  return months
}

/** B minus the best of A, C and D, per month. */
export function offsetVsBest(result: SimulationResult): number[] {
  const { A, B, C, D } = result.scenarios
  return B.rows.map(
    (r, i) => r.netWorth - Math.max(A.rows[i]!.netWorth, C.rows[i]!.netWorth, D.rows[i]!.netWorth),
  )
}

/** B minus C, per month. */
export function offsetVsSavings(result: SimulationResult): number[] {
  return result.scenarios.B.rows.map((r, i) => r.netWorth - result.scenarios.C.rows[i]!.netWorth)
}

/** Converts an amount at `month` to today's CZK. */
export function toReal(value: number, month: number, inflation: number): number {
  return value / (1 + inflation) ** (month / 12)
}

export interface BreakEvenGrid {
  /** x axis: initial savings. */
  savings: number[]
  /** y axis: offset surcharge as a decimal rate (0 … 0.01). */
  surcharges: number[]
  /** `values[iy][ix]` belongs to `surcharges[iy]` and `savings[ix]`. */
  values: number[][]
}

const GRID_POINTS = 11

/** Net worth of B minus the best alternative at the horizon, over initial savings and surcharge. */
export function breakEvenGrid(inputs: Inputs): BreakEvenGrid {
  const max = Math.round(Math.max(2 * inputs.savings.initial, inputs.loan.principal / 2) / 10_000) * 10_000
  const savings = Array.from({ length: GRID_POINTS }, (_, i) => (max * i) / (GRID_POINTS - 1))
  const surcharges = Array.from({ length: GRID_POINTS }, (_, i) => i / 1000)
  const values = surcharges.map((surcharge) =>
    savings.map((initial) => {
      const r = simulate({
        ...inputs,
        loan: { ...inputs.loan, offsetRate: inputs.loan.classicRate + surcharge },
        savings: { ...inputs.savings, initial },
      })
      const s = r.scenarios
      return s.B.summary.netWorth - Math.max(s.A.summary.netWorth, s.C.summary.netWorth, s.D.summary.netWorth)
    }),
  )
  return { savings, surcharges, values }
}

export interface MarginalRates {
  /** Effective annual rate saved by one more crown in the offset. */
  offset: number
  /** Effective annual rate saved by one more crown of prepayment. */
  prepayment: number
  /** Net annual rate of the tier where the next crown on savings accounts lands (scenario C, month 1). */
  savings: number
  /** Net annual rate of the current account. */
  currentAccount: number
  /** Yearly cost of the offset surcharge. */
  surchargeCostPerYear: number
}

function firstYearInterest(result: SimulationResult, id: ScenarioId): number {
  return result.scenarios[id].rows.slice(0, 12).reduce((sum, r) => sum + r.interest, 0)
}

/** Marginal returns of one more crown, for the first year. */
export function marginalRates(inputs: Inputs, result: SimulationResult): MarginalRates {
  const { loan, tax, savings, offset } = inputs
  const effective = (rate: number, interest: number) =>
    tax.deductMortgageInterest && interest <= tax.deductionCap ? rate * (1 - tax.incomeTaxRate) : rate
  const netOfTax = 1 - tax.savingsInterestTax
  // Scenario C never counts anything against the debt, so its month-1 pool is the initial savings.
  const poolC = savings.initial

  return {
    offset: effective(loan.offsetRate, firstYearInterest(result, 'B')),
    prepayment: effective(loan.classicRate, firstYearInterest(result, 'D')),
    savings: marginalSavingsRate(poolC, savings.accounts, savings.currentAccountRate) * netOfTax,
    currentAccount: savings.currentAccountRate * netOfTax,
    surchargeCostPerYear:
      (loan.offsetRate - loan.classicRate) *
      Math.max(0, loan.principal - Math.min(savings.initial, offset.cap ?? Infinity)),
  }
}

export type WarningCode =
  | 'OFFSET_SATURATED'
  | 'NEGATIVE_LIQUID'
  | 'BEYOND_FIXATION_NO_RATE'
  | 'D_LOWER_LIQUIDITY'
  | 'DEDUCTION_REDUCED'
  | 'NO_SAVINGS_ACCOUNTS'
  | 'OFFSET_RATE_BELOW_CLASSIC'

export interface Warning {
  code: WarningCode
  params: Record<string, number | string>
}

/** Warnings as codes with parameters; the UI turns them into text. */
export function warnings(inputs: Inputs, result: SimulationResult): Warning[] {
  const out: Warning[] = []
  const { B, D } = result.scenarios

  if (B.summary.offsetSaturatedMonth !== null) {
    out.push({ code: 'OFFSET_SATURATED', params: { month: B.summary.offsetSaturatedMonth } })
  }
  for (const id of ['A', 'B', 'C', 'D'] as const) {
    const month = result.scenarios[id].summary.negativeLiquidMonth
    if (month !== null) out.push({ code: 'NEGATIVE_LIQUID', params: { scenario: id, month } })
  }
  if (inputs.horizonYears > inputs.loan.fixationYears && inputs.loan.rateAfterFixation === null) {
    out.push({
      code: 'BEYOND_FIXATION_NO_RATE',
      params: { horizonYears: inputs.horizonYears, fixationYears: inputs.loan.fixationYears },
    })
  }
  if (D.summary.liquid < B.summary.liquid) {
    out.push({
      code: 'D_LOWER_LIQUIDITY',
      params: { liquidD: D.summary.liquid, liquidB: B.summary.liquid },
    })
  }
  if (inputs.tax.deductMortgageInterest) {
    const interestB = firstYearInterest(result, 'B')
    if (interestB < inputs.tax.deductionCap) {
      out.push({
        code: 'DEDUCTION_REDUCED',
        params: { interest: interestB, deductionCap: inputs.tax.deductionCap },
      })
    }
  }
  if (inputs.savings.accounts.length === 0) out.push({ code: 'NO_SAVINGS_ACCOUNTS', params: {} })
  if (inputs.loan.offsetRate < inputs.loan.classicRate) {
    out.push({
      code: 'OFFSET_RATE_BELOW_CLASSIC',
      params: { offsetRate: inputs.loan.offsetRate, classicRate: inputs.loan.classicRate },
    })
  }
  return out
}
