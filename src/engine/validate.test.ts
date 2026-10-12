import { expect, test } from 'vitest'
import { defaultInputs } from './defaults.ts'
import { validate } from './validate.ts'
import type { Inputs } from './types.ts'

function pathsFor(change: (i: Inputs) => void): string[] {
  const inputs = defaultInputs()
  change(inputs)
  return validate(inputs).map((e) => e.path)
}

const tier = (i: Inputs, n: number) => {
  const t = i.savings.accounts[0]?.tiers[n]
  if (!t) throw new Error('missing tier')
  return t
}

test('default inputs are valid', () => {
  expect(validate(defaultInputs())).toEqual([])
})

test('errors have Czech messages', () => {
  const inputs = defaultInputs()
  inputs.loan.principal = 0
  expect(validate(inputs)[0]?.message).toBe('Výše úvěru musí být kladná.')
})

test.each<[string, (i: Inputs) => void]>([
  ['loan.principal', (i) => (i.loan.principal = 0)],
  ['loan.principal', (i) => (i.loan.principal = NaN)],
  ['loan.termYears', (i) => (i.loan.termYears = 41)],
  ['loan.termYears', (i) => (i.loan.termYears = 2.5)],
  ['loan.fixationYears', (i) => (i.loan.fixationYears = 31)],
  ['loan.fixationYears', (i) => (i.loan.fixationYears = 0)],
  ['horizonYears', (i) => (i.horizonYears = 31)],
  ['horizonYears', (i) => (i.horizonYears = 0)],
  ['loan.classicRate', (i) => (i.loan.classicRate = 0.3)],
  ['loan.offsetRate', (i) => (i.loan.offsetRate = -0.01)],
  ['loan.rateAfterFixation', (i) => (i.loan.rateAfterFixation = 0.26)],
  ['offset.cap', (i) => (i.offset.cap = 0)],
  ['savings.initial', (i) => (i.savings.initial = -1)],
  ['savings.monthlyDeposit', (i) => (i.savings.monthlyDeposit = -1)],
  ['prepayment.reserve', (i) => (i.prepayment.reserve = -1)],
  ['prepayment.freeAnnualShare', (i) => (i.prepayment.freeAnnualShare = 1.1)],
  ['prepayment.feeRate', (i) => (i.prepayment.feeRate = 0.11)],
  ['savings.depositGrowth', (i) => (i.savings.depositGrowth = 0.21)],
  ['savings.depositGrowth', (i) => (i.savings.depositGrowth = -0.11)],
  ['savings.currentAccountRate', (i) => (i.savings.currentAccountRate = 0.5)],
  ['inflation', (i) => (i.inflation = 0.31)],
  ['inflation', (i) => (i.inflation = -0.06)],
  ['tax.savingsInterestTax', (i) => (i.tax.savingsInterestTax = 1.5)],
  ['tax.incomeTaxRate', (i) => (i.tax.incomeTaxRate = -0.1)],
  ['tax.deductionCap', (i) => (i.tax.deductionCap = -1)],
])('rule violation reported at %s', (path, change) => {
  expect(pathsFor(change)).toContain(path)
})

test('offset rate below classic rate is allowed', () => {
  expect(pathsFor((i) => (i.loan.offsetRate = 0.04))).toEqual([])
})

test('null cap and null rate after fixation are allowed', () => {
  expect(pathsFor((i) => ((i.offset.cap = null), (i.loan.rateAfterFixation = null)))).toEqual([])
})

test('more than five accounts is an error', () => {
  const paths = pathsFor((i) => {
    for (let n = 0; n < 5; n++)
      i.savings.accounts.push({ name: `U${n}`, tiers: [{ upTo: null, rate: 0.01 }] })
  })
  expect(paths).toContain('savings.accounts')
})

test('account without tiers is an error', () => {
  const inputs = defaultInputs()
  inputs.savings.accounts.push({ name: 'Prázdný', tiers: [] })
  expect(validate(inputs).map((e) => e.path)).toContain('savings.accounts.1.tiers')
})

test('tier bounds must be positive and strictly increasing', () => {
  expect(pathsFor((i) => (tier(i, 0).upTo = -5))).toContain('savings.accounts.0.tiers.0.upTo')
  const inputs = defaultInputs()
  inputs.savings.accounts[0]?.tiers.splice(1, 0, { upTo: 300_000, rate: 0.03 })
  expect(validate(inputs).map((e) => e.path)).toContain('savings.accounts.0.tiers.1.upTo')
})

test('unlimited tier is only allowed last', () => {
  expect(pathsFor((i) => (tier(i, 0).upTo = null))).toContain('savings.accounts.0.tiers.0.upTo')
})

test('rates within an account must not increase', () => {
  expect(pathsFor((i) => (tier(i, 1).rate = 0.05))).toContain('savings.accounts.0.tiers.1.rate')
})

test('tier rate out of range is reported', () => {
  expect(pathsFor((i) => (tier(i, 0).rate = 0.9))).toContain('savings.accounts.0.tiers.0.rate')
})
