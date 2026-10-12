import { expect, test } from 'vitest'
import { marginalSavingsRate, savingsInterestGross } from './savings.ts'
import type { SavingsAccount } from './types.ts'

const single: SavingsAccount[] = [
  {
    name: 'Účet',
    tiers: [
      { upTo: 300_000, rate: 0.035 },
      { upTo: null, rate: 0.02 },
    ],
  },
]

const two: SavingsAccount[] = [
  {
    name: 'Účet 1',
    tiers: [
      { upTo: 250_000, rate: 0.04 },
      { upTo: null, rate: 0.005 },
    ],
  },
  {
    name: 'Účet 2',
    tiers: [
      { upTo: 100_000, rate: 0.05 },
      { upTo: 500_000, rate: 0.03 },
      { upTo: null, rate: 0.01 },
    ],
  },
]

test('single account spreads over two tiers', () => {
  expect(savingsInterestGross(500_000, single, 0)).toBeCloseTo((300_000 * 0.035 + 200_000 * 0.02) / 12, 6)
  expect(savingsInterestGross(500_000, single, 0)).toBeCloseTo(1208.33, 2)
})

test('two accounts are filled best rate first', () => {
  // 5 % x 100k, 4 % x 250k, 3 % x 400k, 1 % x remaining 50k
  expect(savingsInterestGross(800_000, two, 0.001)).toBeCloseTo((5000 + 10_000 + 12_000 + 500) / 12, 6)
  expect(savingsInterestGross(800_000, two, 0.001)).toBeCloseTo(2291.67, 2)
})

test('non-positive amount yields zero interest', () => {
  expect(savingsInterestGross(0, single, 0.01)).toBe(0)
  expect(savingsInterestGross(-5, single, 0.01)).toBe(0)
})

test('without accounts only the current account pays', () => {
  expect(savingsInterestGross(120_000, [], 0.01)).toBeCloseTo(100, 6)
})

test('a tier with a lower rate than the current account is used after it', () => {
  expect(savingsInterestGross(200_000, single, 0.04)).toBeCloseTo((200_000 * 0.04) / 12, 6)
})

test('marginal rate at tier boundaries', () => {
  expect(marginalSavingsRate(299_999, single, 0)).toBe(0.035)
  expect(marginalSavingsRate(300_000, single, 0)).toBe(0.02)
  expect(marginalSavingsRate(0, single, 0)).toBe(0.035)
  expect(marginalSavingsRate(-10, single, 0)).toBe(0.035)
})

test('marginal rate without accounts is the current account rate', () => {
  expect(marginalSavingsRate(1_000_000, [], 0.012)).toBe(0.012)
})
