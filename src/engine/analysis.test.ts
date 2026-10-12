import { describe, expect, test } from 'vitest'
import golden from '../../reference/golden.json'
import {
  advantageOverA,
  breakEvenGrid,
  crossovers,
  marginalRates,
  offsetVsBest,
  offsetVsSavings,
  toReal,
  warnings,
} from './analysis.ts'
import { defaultInputs } from './defaults.ts'
import { simulate } from './simulate.ts'
import type { Inputs } from './types.ts'

const goldenInput = (name: string) =>
  (golden.cases as unknown as { name: string; input: Inputs }[]).find((c) => c.name === name)!.input

describe('crossovers', () => {
  test('sign changes', () => expect(crossovers([-1, -1, 2, 3, -1])).toEqual([3, 5]))
  test('starting from zero is not a crossover', () => expect(crossovers([0, 0, 1])).toEqual([]))
  test('zero in between is skipped', () => expect(crossovers([1, 0, -1])).toEqual([3]))
})

describe('series', () => {
  const input = goldenInput('zaklad')
  const result = simulate(input)
  const H = input.horizonYears * 12

  test('advantageOverA', () => {
    const adv = advantageOverA(result)
    expect(adv.B).toHaveLength(H)
    const s = result.scenarios
    expect(adv.C.at(-1)).toBeCloseTo(s.C.summary.netWorth - s.A.summary.netWorth, 6)
  })

  test('offsetVsSavings is negative at the end (C wins) and matches the summaries', () => {
    const diff = offsetVsSavings(result).at(-1)!
    expect(diff).toBeLessThan(0)
    expect(diff).toBeCloseTo(result.scenarios.B.summary.netWorth - result.scenarios.C.summary.netWorth, 6)
  })

  test('offsetVsBest', () => {
    const s = result.scenarios
    const best = Math.max(s.A.summary.netWorth, s.C.summary.netWorth, s.D.summary.netWorth)
    expect(offsetVsBest(result).at(-1)).toBeCloseTo(s.B.summary.netWorth - best, 6)
  })
})

test('toReal', () => {
  expect(toReal(1_102_500, 24, 0.05)).toBeCloseTo(1_000_000, 6)
  expect(toReal(500, 0, 0.05)).toBe(500)
})

describe('breakEvenGrid', () => {
  test('dimensions and the corner value', () => {
    const input = defaultInputs()
    const grid = breakEvenGrid(input)
    expect(grid.savings).toHaveLength(11)
    expect(grid.surcharges).toHaveLength(11)
    expect(grid.values).toHaveLength(11)
    expect(grid.values.every((row) => row.length === 11)).toBe(true)
    expect(grid.savings[0]).toBe(0)
    expect(grid.savings[10]).toBe(2_000_000)
    expect(grid.surcharges[10]).toBeCloseTo(0.01, 12)

    const r = simulate({
      ...input,
      loan: { ...input.loan, offsetRate: input.loan.classicRate },
      savings: { ...input.savings, initial: 0 },
    })
    const s = r.scenarios
    const expected =
      s.B.summary.netWorth - Math.max(s.A.summary.netWorth, s.C.summary.netWorth, s.D.summary.netWorth)
    expect(grid.values[0]![0]).toBeCloseTo(expected, 6)
  })
})

describe('marginalRates', () => {
  test('default inputs', () => {
    const input = defaultInputs()
    const r = marginalRates(input, simulate(input))
    expect(r.offset).toBeCloseTo(0.0519, 10)
    expect(r.prepayment).toBeCloseTo(0.0489, 10)
    expect(r.savings).toBeCloseTo(0.017, 10)
    expect(r.currentAccount).toBe(0)
    expect(r.surchargeCostPerYear).toBeCloseTo(0.003 * 3_700_000, 6)
  })

  test('small loan: interest under the deduction cap', () => {
    const input = goldenInput('maly-uver-strop-offsetu')
    const r = marginalRates(input, simulate(input))
    expect(r.offset).toBeCloseTo(input.loan.offsetRate * 0.85, 10)
    expect(r.prepayment).toBeCloseTo(input.loan.classicRate * 0.85, 10)
    // Surcharge is paid on the loan minus what the offset counts (savings 600k, cap 400k).
    expect(r.surchargeCostPerYear).toBeCloseTo(0.003 * 1_100_000, 6)
  })
})

describe('warnings', () => {
  const codes = (input: Inputs) => warnings(input, simulate(input)).map((w) => w.code)

  test('default inputs: no negative liquid money', () => {
    expect(codes(defaultInputs())).not.toContain('NEGATIVE_LIQUID')
  })

  test('OFFSET_SATURATED', () => {
    const input = defaultInputs()
    input.offset.cap = 100_000
    expect(codes(input)).toContain('OFFSET_SATURATED')
  })

  test('NEGATIVE_LIQUID', () => {
    // Valid inputs cannot trigger it (the budget always covers the largest payment), so patch the result.
    const input = defaultInputs()
    const result = simulate(input)
    result.scenarios.C.summary.negativeLiquidMonth = 7
    const w = warnings(input, result).filter((x) => x.code === 'NEGATIVE_LIQUID')
    expect(w).toEqual([{ code: 'NEGATIVE_LIQUID', params: { scenario: 'C', month: 7 } }])
  })

  test('BEYOND_FIXATION_NO_RATE', () => {
    const input = defaultInputs()
    input.horizonYears = 10
    expect(codes(input)).toContain('BEYOND_FIXATION_NO_RATE')
    input.loan.rateAfterFixation = 0.05
    expect(codes(input)).not.toContain('BEYOND_FIXATION_NO_RATE')
  })

  test('D_LOWER_LIQUIDITY', () => {
    expect(codes(defaultInputs())).toContain('D_LOWER_LIQUIDITY')
  })

  test('DEDUCTION_REDUCED', () => {
    const input = defaultInputs()
    expect(codes(input)).not.toContain('DEDUCTION_REDUCED')
    input.loan.principal = 1_500_000
    expect(codes(input)).toContain('DEDUCTION_REDUCED')
  })

  test('NO_SAVINGS_ACCOUNTS', () => {
    const input = defaultInputs()
    input.savings.accounts = []
    expect(codes(input)).toContain('NO_SAVINGS_ACCOUNTS')
  })

  test('OFFSET_RATE_BELOW_CLASSIC', () => {
    const input = defaultInputs()
    input.loan.offsetRate = 0.04
    expect(codes(input)).toContain('OFFSET_RATE_BELOW_CLASSIC')
  })
})
