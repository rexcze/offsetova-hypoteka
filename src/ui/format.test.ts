import { describe, expect, test } from 'vitest'
import {
  formatAfterYears,
  formatCzk,
  formatInputNumber,
  formatPercent,
  formatYears,
  parseNumber,
} from './format.ts'

const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('formatCzk', () => {
  test('groups thousands and rounds', () => {
    expect(plain(formatCzk(1234567))).toBe('1 234 567 Kč')
    expect(plain(formatCzk(999.6))).toBe('1 000 Kč')
    expect(plain(formatCzk(0))).toBe('0 Kč')
  })
  test('no negative zero', () => expect(plain(formatCzk(-0.2))).toBe('0 Kč'))
  test('negative amounts', () => expect(plain(formatCzk(-21000))).toMatch(/^[-−]21 000 Kč$/))
})

describe('formatPercent', () => {
  test('default two digits', () => expect(plain(formatPercent(0.0489))).toBe('4,89 %'))
  test('custom digits', () => expect(plain(formatPercent(0.15, 0))).toBe('15 %'))
})

describe('parseNumber', () => {
  test.each([
    ['4,89', 4.89],
    ['4.89', 4.89],
    ['1 234 567', 1234567],
    ['1\u00a0234\u00a0567', 1234567],
    ['1\u202f234 567', 1234567],
    ['1 234 567 Kč', 1234567],
    ['4,89 %', 4.89],
    ['-3', -3],
    ['−3,5', -3.5],
    ['  12  ', 12],
  ])('%j → %j', (text, expected) => expect(parseNumber(text)).toBe(expected))

  test.each(['', '   ', 'abc', '1,2,3', '1.234.567', '--1', '4,89x'])('%j → null', (text) =>
    expect(parseNumber(text)).toBeNull(),
  )
})

describe('formatInputNumber', () => {
  test('percent scaling without noise', () => expect(formatInputNumber(0.0489, 100)).toBe('4,89'))
  test('grouped', () => expect(plain(formatInputNumber(4_000_000, 1, true))).toBe('4 000 000'))
  test('empty for null and NaN', () => {
    expect(formatInputNumber(null)).toBe('')
    expect(formatInputNumber(NaN)).toBe('')
  })
})

describe('formatYears', () => {
  test.each([
    [1, '1 rok'],
    [3, '3 roky'],
    [5, '5 let'],
    [30, '30 let'],
  ])('%i → %s', (n, text) => expect(formatYears(n)).toBe(text))
})

describe('formatAfterYears', () => {
  test.each([
    [1, 'po 1 roce'],
    [2, 'po 2 letech'],
    [5, 'po 5 letech'],
  ])('%i → %s', (n, text) => expect(formatAfterYears(n)).toBe(text))
})
