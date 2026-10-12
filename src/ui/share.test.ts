import { describe, expect, test } from 'vitest'
import golden from '../../reference/golden.json'
import { defaultInputs } from '../engine/defaults.ts'
import type { Inputs } from '../engine/types.ts'
import { decodeInputs, encodeInputs, readHash, shareUrl } from './share.ts'

const cases = golden.cases as unknown as { name: string; input: Inputs }[]

describe('round trip', () => {
  test('default inputs', () => {
    const x = defaultInputs()
    expect(decodeInputs(`#${encodeInputs(x)}`)).toEqual(x)
    expect(decodeInputs(encodeInputs(x))).toEqual(x)
  })
  test.each(cases)('golden case $name', ({ input }) => {
    expect(decodeInputs(encodeInputs(input))).toEqual(input)
  })
  test('Czech account names survive', () => {
    const x = defaultInputs()
    x.savings.accounts[0]!.name = 'Spořicí účet – žluťoučký kůň'
    expect(decodeInputs(encodeInputs(x))).toEqual(x)
  })
  test('the hash is URL-safe', () => {
    expect(encodeInputs(defaultInputs())).toMatch(/^v1=[A-Za-z0-9_-]+$/)
  })
})

const raw = (text: string) => `#v1=${Buffer.from(text).toString('base64url')}`

describe('bad hashes', () => {
  const good = encodeInputs(defaultInputs())
  test('empty hash is "none", not an error', () => {
    expect(readHash('')).toEqual({ status: 'none' })
    expect(readHash('#')).toEqual({ status: 'none' })
  })
  test.each([
    ['garbage', '#abc'],
    ['unknown version', `#v2=${good.slice(3)}`],
    ['damaged base64', `#${good.slice(0, 20)}!!`],
    ['truncated', `#${good.slice(0, good.length - 40)}`],
    ['not JSON', raw('hello')],
    ['JSON of a wrong shape', raw('{"loan":1}')],
    ['JSON array', raw('[]')],
  ])('%s → null', (_, hash) => expect(decodeInputs(hash)).toBeNull())

  test('invalid values fail validation', () => {
    const x = defaultInputs()
    x.loan.principal = -5
    expect(decodeInputs(encodeInputs(x))).toBeNull()
    expect(readHash(encodeInputs(x)).status).toBe('invalid')
  })
  test('too many accounts or tiers', () => {
    const x = defaultInputs()
    x.savings.accounts = Array.from({ length: 6 }, () =>
      structuredClone(defaultInputs().savings.accounts[0]!),
    )
    expect(decodeInputs(encodeInputs(x))).toBeNull()
  })
  test('a missing field is rejected', () => {
    const x = JSON.parse(JSON.stringify(defaultInputs()))
    delete x.tax.deductionCap
    expect(decodeInputs(raw(JSON.stringify(x)))).toBeNull()
  })
})

test('shareUrl puts the inputs after the hash', () => {
  const url = shareUrl(defaultInputs(), { origin: 'https://x.test', pathname: '/app/', search: '?a=1' })
  expect(url.startsWith('https://x.test/app/?a=1#v1=')).toBe(true)
})
