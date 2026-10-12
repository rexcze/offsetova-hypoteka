import type { Inputs, MortgageMode, SavingsAccount } from '../engine/types.ts'
import { validate } from '../engine/validate.ts'

const PREFIX = 'v1='
const MAX_ACCOUNTS = 5
const MAX_TIERS = 4

export type HashResult = { status: 'none' } | { status: 'ok'; inputs: Inputs } | { status: 'invalid' }

/** Inputs as `v1=<base64url of UTF-8 JSON>`; goes after `#`, so it never reaches a server. */
export function encodeInputs(inputs: Inputs): string {
  const bytes = new TextEncoder().encode(JSON.stringify(inputs))
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  const base64 = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  return PREFIX + base64
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Builds fresh `Inputs` from untrusted data; null when any field is missing or has the wrong type. */
function parseInputs(raw: unknown): Inputs | null {
  if (!isObj(raw)) return null
  const { loan, offset, savings, prepayment, tax } = raw
  if (!isObj(loan) || !isObj(offset) || !isObj(savings) || !isObj(prepayment) || !isObj(tax)) return null

  const nums = (o: Record<string, unknown>, keys: string[]): number[] | null => {
    const out = keys.map((k) => num(o[k]))
    return out.every((v) => v !== null) ? (out as number[]) : null
  }
  const nullableNum = (v: unknown): number | null | undefined => (v === null ? null : (num(v) ?? undefined))
  const mode = (v: unknown): MortgageMode | null => (v === 'shortenTerm' || v === 'lowerPayment' ? v : null)
  const bool = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null)

  const l = nums(loan, ['principal', 'termYears', 'fixationYears', 'classicRate', 'offsetRate'])
  const s = nums(savings, ['initial', 'monthlyDeposit', 'depositGrowth', 'currentAccountRate'])
  const p = nums(prepayment, ['reserve', 'freeAnnualShare', 'feeRate'])
  const t = nums(tax, ['savingsInterestTax', 'incomeTaxRate', 'deductionCap'])
  const top = nums(raw, ['horizonYears', 'inflation'])
  const rateAfterFixation = nullableNum(loan.rateAfterFixation)
  const cap = nullableNum(offset.cap)
  const offsetMode = mode(offset.mode)
  const prepayMode = mode(prepayment.mode)
  const pInitial = bool(prepayment.initial)
  const pAnnual = bool(prepayment.annual)
  const deduct = bool(tax.deductMortgageInterest)
  if (!l || !s || !p || !t || !top) return null
  if (rateAfterFixation === undefined || cap === undefined) return null
  if (!offsetMode || !prepayMode || pInitial === null || pAnnual === null || deduct === null) return null

  if (!Array.isArray(savings.accounts) || savings.accounts.length > MAX_ACCOUNTS) return null
  const accounts: SavingsAccount[] = []
  for (const a of savings.accounts) {
    if (!isObj(a) || typeof a.name !== 'string' || !Array.isArray(a.tiers) || a.tiers.length > MAX_TIERS)
      return null
    const tiers: SavingsAccount['tiers'] = []
    for (const tier of a.tiers) {
      if (!isObj(tier)) return null
      const upTo = nullableNum(tier.upTo)
      const rate = num(tier.rate)
      if (upTo === undefined || rate === null) return null
      tiers.push({ upTo, rate })
    }
    accounts.push({ name: a.name, tiers })
  }

  return {
    loan: {
      principal: l[0]!,
      termYears: l[1]!,
      fixationYears: l[2]!,
      classicRate: l[3]!,
      offsetRate: l[4]!,
      rateAfterFixation,
    },
    offset: { mode: offsetMode, cap },
    savings: {
      initial: s[0]!,
      monthlyDeposit: s[1]!,
      depositGrowth: s[2]!,
      currentAccountRate: s[3]!,
      accounts,
    },
    prepayment: {
      reserve: p[0]!,
      initial: pInitial,
      annual: pAnnual,
      freeAnnualShare: p[1]!,
      feeRate: p[2]!,
      mode: prepayMode,
    },
    tax: {
      savingsInterestTax: t[0]!,
      deductMortgageInterest: deduct,
      incomeTaxRate: t[1]!,
      deductionCap: t[2]!,
    },
    horizonYears: top[0]!,
    inflation: top[1]!,
  }
}

/** Reads inputs from a URL hash (with or without the leading `#`). */
export function readHash(hash: string): HashResult {
  const text = hash.replace(/^#/, '')
  if (text === '') return { status: 'none' }
  if (!text.startsWith(PREFIX)) return { status: 'invalid' }
  try {
    const base64 = text.slice(PREFIX.length).replaceAll('-', '+').replaceAll('_', '/')
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const inputs = parseInputs(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
    return inputs !== null && validate(inputs).length === 0 ? { status: 'ok', inputs } : { status: 'invalid' }
  } catch {
    return { status: 'invalid' }
  }
}

/** Inputs from a hash, or null when it is absent, damaged, of an unknown version or invalid. */
export function decodeInputs(hash: string): Inputs | null {
  const result = readHash(hash)
  return result.status === 'ok' ? result.inputs : null
}

/** Full link to the current page with the inputs in the hash. */
export function shareUrl(inputs: Inputs, location: Pick<Location, 'origin' | 'pathname' | 'search'>): string {
  return `${location.origin}${location.pathname}${location.search}#${encodeInputs(inputs)}`
}
