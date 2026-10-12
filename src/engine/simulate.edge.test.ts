import { describe, expect, test } from 'vitest'
import { annuity } from './annuity.ts'
import { defaultInputs } from './defaults.ts'
import { simulate } from './simulate.ts'

describe('edge cases', () => {
  test('horizon = term: loans are repaid and the whole budget goes to liquid money', () => {
    const input = defaultInputs()
    input.loan.termYears = 10
    input.loan.fixationYears = 10
    input.horizonYears = 10
    input.savings.monthlyDeposit = 2_000
    const r = simulate(input)
    for (const id of ['A', 'B', 'C', 'D'] as const) {
      const s = r.scenarios[id].summary
      expect(s.debt).toBe(0)
      expect(s.payoffMonth).not.toBeNull()
    }
    expect(r.scenarios.A.summary.payoffMonth).toBe(120)
    // D is paid off earlier by prepayments; afterwards the whole budget goes to liquid money.
    const dPayoff = r.scenarios.D.summary.payoffMonth!
    expect(dPayoff).toBeLessThan(120)
    const rows = r.scenarios.D.rows
    const after = rows[dPayoff]! // month dPayoff + 1
    expect(after.payment).toBe(0)
    expect(after.liquid - rows[dPayoff - 1]!.liquid).toBeCloseTo(
      after.budget + after.savingsInterestNet + after.taxRefund,
      6,
    )
  })

  test('savings > loan: B pays zero interest from month 1, D is paid off at start', () => {
    const input = defaultInputs()
    input.loan.principal = 1_000_000
    input.savings.initial = 1_500_000
    const r = simulate(input)
    expect(r.scenarios.B.rows[0]!.interest).toBe(0)
    expect(r.scenarios.D.summary.payoffMonth).toBe(0)
    expect(r.scenarios.B.summary.offsetSaturatedMonth).toBe(1)
  })

  test('fixation = term: no refixation', () => {
    const input = defaultInputs()
    input.loan.termYears = 5
    input.loan.fixationYears = 5
    input.loan.rateAfterFixation = 0.09
    input.horizonYears = 5
    const r = simulate(input)
    expect(r.scenarios.A.summary.debt).toBe(0)
    expect(r.scenarios.A.rows[0]!.payment).toBeCloseTo(annuity(4_000_000, 0.0489, 60), 6)
  })

  test('offset cap below savings saturates the offset in month 1', () => {
    const input = defaultInputs()
    input.offset.cap = 100_000
    const r = simulate(input)
    expect(r.scenarios.B.summary.offsetSaturatedMonth).toBe(1)
    expect(r.scenarios.B.rows[0]!.counted).toBe(100_000)
  })

  test('lowerPayment: principal of B follows the amortization schedule', () => {
    const input = defaultInputs()
    input.offset.mode = 'lowerPayment'
    const r = simulate(input)
    const rows = r.scenarios.B.rows
    const a = annuity(4_000_000, 0.0519, 360)
    const i = 0.0519 / 12
    expect(rows[0]!.principal).toBeCloseTo(a - 4_000_000 * i, 6)
    const debt1 = rows[0]!.debt
    expect(rows[1]!.principal).toBeCloseTo(a - debt1 * i, 6)
    // Offset saves interest, so the payment is lower than the annuity.
    expect(rows[0]!.payment).toBeLessThan(a)
  })
})
