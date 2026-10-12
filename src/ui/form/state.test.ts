import { describe, expect, test } from 'vitest'
import { defaultInputs } from '../../engine/defaults.ts'
import type { Inputs } from '../../engine/types.ts'
import { encodeInputs, readHash } from '../share.ts'
import { simpleSavingsRate, surchargePoints } from './selectors.ts'
import { initialState, reducer, type Action, type FormState } from './state.ts'

const run = (state: FormState, ...actions: Action[]) => actions.reduce(reducer, state)
const classic = (text: string): Action => ({
  type: 'text',
  path: 'loan.classicRate',
  text,
  scale: 100,
  optional: false,
})

/** Default inputs with equal classic and offset rates. */
function equalRates(): FormState {
  return run(initialState(), { type: 'offsetRateDiffers', value: false })
}

describe('offsetRateDiffers', () => {
  test('defaults have different rates, so it starts true', () => {
    expect(initialState().offsetRateDiffers).toBe(true)
  })

  test('while false, the classic rate is copied to the offset rate (inputs and lastValid)', () => {
    const state = run(equalRates(), classic('5,5'))
    expect(state.inputs.loan.classicRate).toBe(0.055)
    expect(state.inputs.loan.offsetRate).toBe(0.055)
    expect(state.lastValid.loan.offsetRate).toBe(0.055)
  })

  test('while true, the classic rate leaves the offset rate alone', () => {
    const state = run(initialState(), classic('5,5'))
    expect(state.inputs.loan.classicRate).toBe(0.055)
    expect(state.inputs.loan.offsetRate).toBe(0.0519)
  })

  test('turning it on keeps the current offset rate', () => {
    const state = run(equalRates(), classic('5'), { type: 'offsetRateDiffers', value: true })
    expect(state.offsetRateDiffers).toBe(true)
    expect(state.inputs.loan.offsetRate).toBe(0.05)
    expect(state.lastValid.loan.offsetRate).toBe(0.05)
  })

  test('turning it off sets the offset rate to the classic rate', () => {
    const state = run(initialState(), { type: 'offsetRateDiffers', value: false })
    expect(state.offsetRateDiffers).toBe(false)
    expect(state.inputs.loan.offsetRate).toBe(state.inputs.loan.classicRate)
    expect(state.lastValid.loan.offsetRate).toBe(0.0489)
  })

  test('typed text of the offset rate is dropped when it is turned off', () => {
    const typed = run(initialState(), {
      type: 'text',
      path: 'loan.offsetRate',
      text: '6',
      scale: 100,
      optional: false,
    })
    expect(typed.texts['loan.offsetRate']).toBe('6')
    expect(run(typed, { type: 'offsetRateDiffers', value: false }).texts['loan.offsetRate']).toBeUndefined()
  })

  test('an invalid classic rate makes both rates invalid and keeps the last valid results', () => {
    const state = run(equalRates(), classic('99'))
    expect(state.lastValid.loan.classicRate).toBe(0.0489)
    expect(state.lastValid.loan.offsetRate).toBe(0.0489)
  })
})

describe('state loaded from a link', () => {
  const from = (inputs: Inputs) => initialState(readHash(encodeInputs(inputs)))

  test('different rates → true', () => {
    expect(from(defaultInputs()).offsetRateDiffers).toBe(true)
  })

  test('equal rates → false', () => {
    const inputs = defaultInputs()
    inputs.loan.offsetRate = inputs.loan.classicRate
    expect(from(inputs).offsetRateDiffers).toBe(false)
  })
})

describe('surchargePoints', () => {
  test('0.0519 − 0.0489 is 0.30', () => expect(surchargePoints(defaultInputs())).toBe(0.3))

  test('negative surcharge', () => {
    const inputs = defaultInputs()
    inputs.loan.offsetRate = 0.0479
    expect(surchargePoints(inputs)).toBe(-0.1)
  })

  test('equal rates give 0, not -0', () => {
    const inputs = defaultInputs()
    inputs.loan.offsetRate = inputs.loan.classicRate
    expect(Object.is(surchargePoints(inputs), 0)).toBe(true)
  })
})

describe('simple savings rate', () => {
  const setRate = (rate: number): Action => ({ type: 'simpleSavingsRate', rate })

  test('changes only the first tier of the first account', () => {
    const state = run(initialState(), setRate(0.03))
    const tiers = state.inputs.savings.accounts[0]!.tiers
    expect(tiers[0]).toEqual({ upTo: 300_000, rate: 0.03 })
    expect(tiers[1]).toEqual({ upTo: null, rate: 0.02 })
    expect(state.lastValid.savings.accounts[0]!.tiers[0]!.rate).toBe(0.03)
  })

  test('a rate above the next tier is flagged and the last valid inputs stay', () => {
    const state = run(initialState(), setRate(0.035), setRate(0.01))
    // 1 % in the first tier, 2 % in the second: rates must not rise.
    expect(state.inputs.savings.accounts[0]!.tiers[0]!.rate).toBe(0.01)
    expect(state.lastValid.savings.accounts[0]!.tiers[0]!.rate).toBe(0.035)
  })

  test('without accounts it creates one with a single unlimited tier', () => {
    const none = run(initialState(), { type: 'removeAccount', account: 0 })
    expect(none.inputs.savings.accounts).toHaveLength(0)
    const state = run(none, setRate(0.04))
    expect(state.inputs.savings.accounts).toEqual([
      { name: 'Spořicí účet', tiers: [{ upTo: null, rate: 0.04 }] },
    ])
    expect(state.lastValid.savings.accounts).toHaveLength(1)
  })

  test('other accounts are left alone', () => {
    const two = run(initialState(), { type: 'addAccount' })
    const state = run(two, setRate(0.03))
    expect(state.inputs.savings.accounts[1]).toEqual(two.inputs.savings.accounts[1])
  })

  test('typed texts of the field survive', () => {
    const typed = run(
      initialState(),
      {
        type: 'text',
        path: 'savings.accounts.0.tiers.0.rate',
        text: '3,',
        scale: 100,
        optional: false,
      },
      setRate(0.03),
    )
    expect(typed.texts['savings.accounts.0.tiers.0.rate']).toBe('3,')
  })

  test('selector: rate and hasMoreTiers', () => {
    const inputs = defaultInputs()
    expect(simpleSavingsRate(inputs)).toEqual({ rate: 0.035, hasMoreTiers: true })
    inputs.savings.accounts[0]!.tiers = [{ upTo: null, rate: 0.03 }]
    expect(simpleSavingsRate(inputs)).toEqual({ rate: 0.03, hasMoreTiers: false })
    inputs.savings.accounts.push({ name: 'Další', tiers: [{ upTo: null, rate: 0.01 }] })
    expect(simpleSavingsRate(inputs).hasMoreTiers).toBe(true)
    inputs.savings.accounts = []
    expect(simpleSavingsRate(inputs)).toEqual({ rate: null, hasMoreTiers: false })
  })
})

describe('example and reset', () => {
  const edited = () =>
    run(
      initialState(),
      { type: 'showReal', value: true },
      { type: 'offsetRateDiffers', value: false },
      classic('7'),
    )

  test('example restores the defaults and keeps showReal', () => {
    const state = run(edited(), { type: 'example' })
    expect(state.inputs).toEqual(defaultInputs())
    expect(state.offsetRateDiffers).toBe(true)
    expect(state.showReal).toBe(true)
  })

  test('reset also clears showReal', () => {
    const state = run(edited(), { type: 'reset' })
    expect(state.inputs).toEqual(defaultInputs())
    expect(state.showReal).toBe(false)
  })
})
