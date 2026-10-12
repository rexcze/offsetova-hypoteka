import { expect, test } from 'vitest'
import { annuity } from './annuity.ts'

test('matches the reference payment', () => {
  expect(annuity(4_000_000, 0.0489, 360)).toBeCloseTo(21_204.76, 2)
})

test('zero rate splits the principal evenly', () => {
  expect(annuity(120_000, 0, 12)).toBe(10_000)
})

test('nothing to repay gives zero', () => {
  expect(annuity(0, 0.05, 12)).toBe(0)
  expect(annuity(-1, 0.05, 12)).toBe(0)
  expect(annuity(1000, 0.05, 0)).toBe(0)
})
