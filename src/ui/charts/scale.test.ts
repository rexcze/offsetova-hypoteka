import { expect, test } from 'vitest'
import { niceTicks, yearTicks } from './scale.ts'

test('niceTicks covers the range with round values', () => {
  const t = niceTicks(-37_000, 112_000)
  expect(t[0]).toBeLessThanOrEqual(-37_000)
  expect(t.at(-1)).toBeGreaterThanOrEqual(112_000)
  expect(t).toContain(0)
  const step = t[1]! - t[0]!
  expect(t.every((v) => Math.abs(v % step) < 1e-6)).toBe(true)
})

test('niceTicks handles an empty range', () => {
  expect(niceTicks(5, 5).length).toBeGreaterThan(1)
})

test('yearTicks thins out long horizons', () => {
  expect(yearTicks(60)).toEqual([12, 24, 36, 48, 60])
  expect(yearTicks(360).length).toBeLessThanOrEqual(8)
  expect(yearTicks(360)[0]).toBe(48)
})
