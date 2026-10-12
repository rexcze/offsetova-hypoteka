import type { SavingsAccount } from './types.ts'

interface Slot {
  rate: number
  /** Capacity in CZK; Infinity for the unlimited tier. */
  capacity: number
}

/** Tiers of all accounts plus the current account, best rate first (stable for equal rates). */
function buildSlots(accounts: SavingsAccount[], currentAccountRate: number): Slot[] {
  const slots: Slot[] = []
  for (const account of accounts) {
    let prev = 0
    for (const tier of account.tiers) {
      if (tier.upTo === null) {
        slots.push({ rate: tier.rate, capacity: Infinity })
        break
      }
      slots.push({ rate: tier.rate, capacity: tier.upTo - prev })
      prev = tier.upTo
    }
  }
  slots.push({ rate: currentAccountRate, capacity: Infinity })
  return slots.sort((a, b) => b.rate - a.rate)
}

/** Gross monthly interest when `amount` is spread greedily over the best-paying tiers. */
export function savingsInterestGross(
  amount: number,
  accounts: SavingsAccount[],
  currentAccountRate: number,
): number {
  if (amount <= 0) return 0
  let rest = amount
  let interest = 0
  for (const slot of buildSlots(accounts, currentAccountRate)) {
    if (rest <= 0) break
    const part = Math.min(rest, slot.capacity)
    interest += (part * slot.rate) / 12
    rest -= part
  }
  return interest
}

/** Gross annual rate of the tier where the next crown would land (strictly above `amount`). */
export function marginalSavingsRate(
  amount: number,
  accounts: SavingsAccount[],
  currentAccountRate: number,
): number {
  let cumulative = 0
  for (const slot of buildSlots(accounts, currentAccountRate)) {
    cumulative += slot.capacity
    if (cumulative > Math.max(amount, 0)) return slot.rate
  }
  return currentAccountRate
}
