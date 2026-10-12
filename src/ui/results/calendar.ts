import { toReal } from '../../engine/analysis.ts'
import type { MonthRow } from '../../engine/types.ts'

export interface YearRow {
  year: number
  /** Months of the year (12 rows), already converted when `real` is set. */
  months: MonthRow[]
  // Sums over the year.
  payment: number
  interest: number
  principal: number
  prepayment: number
  prepaymentFee: number
  savingsInterestNet: number
  taxRefund: number
  /** Mean amount counted against the debt (offset only). */
  avgCounted: number
  // State at the end of the year.
  debt: number
  liquid: number
  netWorth: number
}

/** Converts every amount of a month to today's CZK with that month's own factor. */
export function monthToReal(row: MonthRow, inflation: number): MonthRow {
  const f = (v: number) => toReal(v, row.month, inflation)
  return {
    month: row.month,
    budget: f(row.budget),
    payment: f(row.payment),
    interest: f(row.interest),
    principal: f(row.principal),
    prepayment: f(row.prepayment),
    prepaymentFee: f(row.prepaymentFee),
    savingsInterestNet: f(row.savingsInterestNet),
    taxRefund: f(row.taxRefund),
    counted: f(row.counted),
    debt: f(row.debt),
    liquid: f(row.liquid),
    netWorth: f(row.netWorth),
  }
}

/** Aggregates monthly rows into years (flows summed, balances taken from the last month of the year). */
export function aggregateYears(rows: MonthRow[], inflation: number, real: boolean): YearRow[] {
  const converted = real ? rows.map((r) => monthToReal(r, inflation)) : rows
  const years: YearRow[] = []
  for (let i = 0; i < converted.length; i += 12) {
    const months = converted.slice(i, i + 12)
    const sum = (pick: (r: MonthRow) => number) => months.reduce((acc, r) => acc + pick(r), 0)
    const last = months[months.length - 1]!
    years.push({
      year: i / 12 + 1,
      months,
      payment: sum((r) => r.payment),
      interest: sum((r) => r.interest),
      principal: sum((r) => r.principal),
      prepayment: sum((r) => r.prepayment),
      prepaymentFee: sum((r) => r.prepaymentFee),
      savingsInterestNet: sum((r) => r.savingsInterestNet),
      taxRefund: sum((r) => r.taxRefund),
      avgCounted: sum((r) => r.counted) / months.length,
      debt: last.debt,
      liquid: last.liquid,
      netWorth: last.netWorth,
    })
  }
  return years
}
