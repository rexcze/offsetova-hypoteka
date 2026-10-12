import type { Inputs } from '../../engine/types.ts'

/** Offset surcharge over the classic rate in percentage points, rounded to 2 decimals (may be negative). */
export function surchargePoints(inputs: Inputs): number {
  const { classicRate, offsetRate } = inputs.loan
  return Math.round((offsetRate - classicRate) * 10_000) / 100 || 0
}

/**
 * The rate of the first tier of the first savings account, which the simple savings field edits.
 * `hasMoreTiers` is true when savings can also earn a different (lower) rate elsewhere: more tiers
 * in the first account or more accounts.
 */
export function simpleSavingsRate(inputs: Inputs): { rate: number | null; hasMoreTiers: boolean } {
  const accounts = inputs.savings.accounts
  const first = accounts[0]
  return {
    rate: first?.tiers[0]?.rate ?? null,
    hasMoreTiers: accounts.length > 1 || (first?.tiers.length ?? 0) > 1,
  }
}
