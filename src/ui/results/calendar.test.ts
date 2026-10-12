import { expect, test } from 'vitest'
import { toReal } from '../../engine/analysis.ts'
import { defaultInputs } from '../../engine/defaults.ts'
import { simulate } from '../../engine/simulate.ts'
import { aggregateYears } from './calendar.ts'

const input = { ...defaultInputs(), horizonYears: 10 }
const result = simulate(input)

test('yearly sums match the monthly rows and balances match months 12, 24, …', () => {
  for (const id of ['A', 'B', 'C', 'D'] as const) {
    const rows = result.scenarios[id].rows
    const years = aggregateYears(rows, input.inflation, false)
    expect(years).toHaveLength(10)
    years.forEach((y, i) => {
      const slice = rows.slice(i * 12, i * 12 + 12)
      const sum = (pick: (r: (typeof rows)[number]) => number) => slice.reduce((a, r) => a + pick(r), 0)
      expect(y.payment).toBeCloseTo(
        sum((r) => r.payment),
        6,
      )
      expect(y.interest).toBeCloseTo(
        sum((r) => r.interest),
        6,
      )
      expect(y.principal).toBeCloseTo(
        sum((r) => r.principal),
        6,
      )
      expect(y.prepayment).toBeCloseTo(
        sum((r) => r.prepayment),
        6,
      )
      expect(y.savingsInterestNet).toBeCloseTo(
        sum((r) => r.savingsInterestNet),
        6,
      )
      expect(y.taxRefund).toBeCloseTo(
        sum((r) => r.taxRefund),
        6,
      )
      const end = rows[(i + 1) * 12 - 1]!
      expect(y.debt).toBe(end.debt)
      expect(y.liquid).toBe(end.liquid)
      expect(y.netWorth).toBe(end.netWorth)
      expect(y.months).toHaveLength(12)
    })
  }
})

test('total of yearly interest equals the summary', () => {
  const years = aggregateYears(result.scenarios.B.rows, input.inflation, false)
  const total = years.reduce((a, y) => a + y.interest, 0)
  expect(total).toBeCloseTo(result.scenarios.B.summary.interestPaid, 6)
})

test('average counted amount is the mean of the months', () => {
  const rows = result.scenarios.B.rows
  const y1 = aggregateYears(rows, input.inflation, false)[0]!
  expect(y1.avgCounted).toBeCloseTo(rows.slice(0, 12).reduce((a, r) => a + r.counted, 0) / 12, 6)
})

test('real mode converts each month with its own factor', () => {
  const rows = result.scenarios.B.rows
  const [y1] = aggregateYears(rows, input.inflation, true)
  const expectedPayment = rows
    .slice(0, 12)
    .reduce((a, r) => a + toReal(r.payment, r.month, input.inflation), 0)
  expect(y1!.payment).toBeCloseTo(expectedPayment, 6)
  expect(y1!.netWorth).toBeCloseTo(toReal(rows[11]!.netWorth, 12, input.inflation), 6)
  expect(y1!.months[5]!.debt).toBeCloseTo(toReal(rows[5]!.debt, 6, input.inflation), 6)
})
