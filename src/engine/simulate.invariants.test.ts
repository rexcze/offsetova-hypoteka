import { describe, expect, test } from 'vitest'
import golden from '../../reference/golden.json'
import { defaultInputs } from './defaults.ts'
import { simulate } from './simulate.ts'
import type { Inputs, ScenarioId } from './types.ts'

const IDS: ScenarioId[] = ['A', 'B', 'C', 'D']
const cases = golden.cases as unknown as { name: string; input: Inputs }[]

describe.each(cases)('invariants 1, 2: $name', ({ input }) => {
  const result = simulate(input)

  test('1: cash balance', () => {
    for (const id of IDS) {
      const rows = result.scenarios[id].rows
      // Initial liquid of D is reduced by the up-front prepayment.
      let prev = input.savings.initial
      if (id === 'D' && input.prepayment.initial) {
        prev -= Math.min(input.loan.principal, Math.max(0, input.savings.initial - input.prepayment.reserve))
      }
      for (const r of rows) {
        const expected =
          prev + r.budget - r.payment + r.savingsInterestNet + r.taxRefund - r.prepayment - r.prepaymentFee
        expect(r.liquid, `${id} month ${r.month}`).toBeCloseTo(expected, 6)
        prev = r.liquid
      }
    }
  })

  test('2: same budget in every scenario', () => {
    for (const id of IDS) {
      result.scenarios[id].rows.forEach((r, i) => {
        expect(r.budget).toBe(result.budgets[i])
      })
    }
  })
})

describe('invariants 3-7', () => {
  test('3: A equals B without surcharge, savings and tax deduction', () => {
    const input = defaultInputs()
    input.loan.offsetRate = input.loan.classicRate
    input.savings.initial = 0
    input.savings.monthlyDeposit = 0
    input.tax.deductMortgageInterest = false
    input.horizonYears = 10
    const r = simulate(input)
    r.scenarios.A.rows.forEach((a, i) => {
      const b = r.scenarios.B.rows[i]!
      expect(b.netWorth).toBeCloseTo(a.netWorth, 6)
      expect(b.debt).toBeCloseTo(a.debt, 6)
    })
  })

  test('4: B is at least as good as A with zero surcharge, rates and taxes', () => {
    const input = defaultInputs()
    input.loan.offsetRate = input.loan.classicRate
    input.savings.accounts = []
    input.savings.currentAccountRate = 0
    input.savings.monthlyDeposit = 3_000
    input.tax.savingsInterestTax = 0
    input.tax.deductMortgageInterest = false
    input.horizonYears = 10
    const r = simulate(input)
    r.scenarios.A.rows.forEach((a, i) => {
      expect(r.scenarios.B.rows[i]!.netWorth).toBeGreaterThanOrEqual(a.netWorth - 1e-6)
    })
  })

  test('5: annuity of A is unchanged at refixation without a new rate', () => {
    const input = defaultInputs()
    input.horizonYears = 10
    const rows = simulate(input).scenarios.A.rows
    const F = input.loan.fixationYears * 12
    expect(rows[F]!.payment).toBeCloseTo(rows[F - 1]!.payment, 6)
  })

  test('6: inflation does not change the ranking', () => {
    for (const { input } of cases) {
      const base = simulate(input).ranking
      for (const inflation of [-0.05, 0, 0.1, 0.3]) {
        expect(simulate({ ...input, inflation }).ranking).toEqual(base)
      }
    }
  })

  test('7: default inputs never produce negative liquid money', () => {
    const r = simulate(defaultInputs())
    for (const id of IDS) expect(r.scenarios[id].summary.negativeLiquidMonth).toBeNull()
  })
})
