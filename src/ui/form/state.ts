import { defaultInputs } from '../../engine/defaults.ts'
import type { Inputs } from '../../engine/types.ts'
import { validate } from '../../engine/validate.ts'
import { parseNumber } from '../format.ts'

export interface FormState {
  inputs: Inputs
  /** Text typed into number fields, by path; a field without an entry shows its value from `inputs`. */
  texts: Record<string, string>
  /** Last inputs that passed validation; results are computed from these. */
  lastValid: Inputs
  /** Once the user edits the horizon, it stops following the fixation. */
  horizonTouched: boolean
  showReal: boolean
}

export type Action =
  | { type: 'text'; path: string; text: string; scale: number; optional: boolean }
  | { type: 'set'; path: string; value: string | number | boolean }
  | { type: 'addAccount' }
  | { type: 'removeAccount'; account: number }
  | { type: 'addTier'; account: number }
  | { type: 'removeTier'; account: number; tier: number }
  | { type: 'growthFromInflation' }
  | { type: 'showReal'; value: boolean }
  | { type: 'reset' }

export const MAX_ACCOUNTS = 5
export const MAX_TIERS = 4

export function getAt(root: object, path: string): unknown {
  let node: unknown = root
  for (const key of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[key]
  }
  return node
}

function setAt(inputs: Inputs, path: string, value: unknown): Inputs {
  const next = structuredClone(inputs)
  const keys = path.split('.')
  let node = next as unknown as Record<string, unknown>
  for (const key of keys.slice(0, -1)) node = node[key] as Record<string, unknown>
  node[keys[keys.length - 1]!] = value
  return next
}

function dropTexts(texts: Record<string, string>, prefix: string): Record<string, string> {
  return Object.fromEntries(Object.entries(texts).filter(([path]) => !path.startsWith(prefix)))
}

export function initialState(): FormState {
  const inputs = defaultInputs()
  return { inputs, texts: {}, lastValid: inputs, horizonTouched: false, showReal: false }
}

function withValidity(state: FormState): FormState {
  return validate(state.inputs).length === 0 ? { ...state, lastValid: state.inputs } : state
}

/** Structural change of the accounts list: indices shift, so typed texts are discarded. */
function withAccounts(
  state: FormState,
  change: (accounts: Inputs['savings']['accounts']) => void,
): FormState {
  const inputs = structuredClone(state.inputs)
  change(inputs.savings.accounts)
  return withValidity({ ...state, inputs, texts: dropTexts(state.texts, 'savings.accounts') })
}

export function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'text': {
      const parsed = parseNumber(action.text)
      const empty = action.text.trim() === ''
      const value =
        parsed !== null
          ? Number((parsed / action.scale).toPrecision(12))
          : empty && action.optional
            ? null
            : NaN
      let inputs = setAt(state.inputs, action.path, value)
      const texts = { ...state.texts, [action.path]: action.text }
      if (action.path === 'loan.fixationYears' && !state.horizonTouched && parsed !== null) {
        inputs = setAt(inputs, 'horizonYears', parsed)
        delete texts.horizonYears
      }
      return withValidity({
        ...state,
        inputs,
        texts,
        horizonTouched: state.horizonTouched || action.path === 'horizonYears',
      })
    }
    case 'set':
      return withValidity({ ...state, inputs: setAt(state.inputs, action.path, action.value) })
    case 'addAccount':
      return withAccounts(state, (accounts) => {
        if (accounts.length >= MAX_ACCOUNTS) return
        accounts.push({ name: `Účet ${accounts.length + 1}`, tiers: [{ upTo: null, rate: 0.02 }] })
      })
    case 'removeAccount':
      return withAccounts(state, (accounts) => {
        accounts.splice(action.account, 1)
      })
    case 'addTier':
      return withAccounts(state, (accounts) => {
        const tiers = accounts[action.account]?.tiers
        const last = tiers?.[tiers.length - 1]
        if (!tiers || !last || tiers.length >= MAX_TIERS) return
        const prevUpTo = tiers.length > 1 ? (tiers[tiers.length - 2]!.upTo ?? 0) : 0
        last.upTo = prevUpTo + 100_000
        tiers.push({ upTo: null, rate: last.rate })
      })
    case 'removeTier':
      return withAccounts(state, (accounts) => {
        const tiers = accounts[action.account]?.tiers
        if (!tiers || tiers.length <= 1) return
        tiers.splice(action.tier, 1)
        tiers[tiers.length - 1]!.upTo = null
      })
    case 'growthFromInflation': {
      const texts = { ...state.texts }
      delete texts['savings.depositGrowth']
      return withValidity({
        ...state,
        texts,
        inputs: setAt(state.inputs, 'savings.depositGrowth', state.inputs.inflation),
      })
    }
    case 'showReal':
      return { ...state, showReal: action.value }
    case 'reset':
      return { ...initialState(), showReal: state.showReal }
  }
}
