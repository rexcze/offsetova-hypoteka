import { annuity } from './annuity.ts'
import { savingsInterestGross } from './savings.ts'
import type { Inputs, MonthRow, ScenarioId, ScenarioSummary, SimulationResult } from './types.ts'

const EPS = 1e-6
const SCENARIO_IDS: ScenarioId[] = ['A', 'B', 'C', 'D']

interface ScenarioState {
  id: ScenarioId
  debt: number
  liquid: number
  rate: number
  annuity: number
  yearInterest: number
  interestPaid: number
  taxRefund: number
  savingsInterestNet: number
  prepaymentFees: number
  payoffMonth: number | null
  offsetSaturatedMonth: number | null
  negativeLiquidMonth: number | null
  rows: MonthRow[]
}

/** Monthly simulation of all four scenarios with the same budget (docs/specifikace.md, section 4). */
export function simulate(inputs: Inputs): SimulationResult {
  const { loan, offset, savings, prepayment: pre, tax } = inputs
  const P = loan.principal
  const n = loan.termYears * 12
  const F = loan.fixationYears * 12
  const H = inputs.horizonYears * 12
  const rc = loan.classicRate
  const ro = loan.offsetRate
  const surcharge = ro - rc

  const states: ScenarioState[] = SCENARIO_IDS.map((id) => ({
    id,
    debt: P,
    liquid: savings.initial,
    rate: id === 'B' ? ro : rc,
    annuity: 0,
    yearInterest: 0,
    interestPaid: 0,
    taxRefund: 0,
    savingsInterestNet: 0,
    prepaymentFees: 0,
    payoffMonth: null,
    offsetSaturatedMonth: null,
    negativeLiquidMonth: null,
    rows: [],
  }))

  // Scenario D: savings above the reserve reduce the loan up front (borrow less), no fee.
  const d = states[3]!
  if (pre.initial) {
    const a0 = Math.min(P, Math.max(0, savings.initial - pre.reserve))
    d.debt -= a0
    d.liquid -= a0
    if (d.debt <= EPS) {
      d.debt = 0
      d.payoffMonth = 0
    }
  }

  for (const s of states) s.annuity = annuity(s.debt, s.rate, n)

  const maxActiveAnnuity = (): number | null => {
    const active = states.filter((s) => s.debt > 0).map((s) => s.annuity)
    return active.length > 0 ? Math.max(...active) : null
  }

  let budgetBase = maxActiveAnnuity() ?? 0
  const budgets: number[] = []

  for (let m = 1; m <= H; m++) {
    // Refixation at the start of the first month after the fixation.
    if (m === F + 1 && F < n) {
      const newRc = loan.rateAfterFixation ?? rc
      for (const s of states) {
        s.rate = s.id === 'B' ? newRc + surcharge : newRc
        if (s.debt > 0) s.annuity = annuity(s.debt, s.rate, n - F)
      }
      const next = maxActiveAnnuity()
      if (next !== null) budgetBase = next
    }

    const deposit = savings.monthlyDeposit * (1 + savings.depositGrowth) ** Math.floor((m - 1) / 12)
    const budget = budgetBase + deposit
    budgets.push(budget)

    for (const s of states) {
      const debt0 = s.debt
      const liquid0 = s.liquid

      let counted = 0
      if (s.id === 'B' && debt0 > 0 && liquid0 > 0) {
        const capEff = offset.cap === null ? debt0 : Math.min(offset.cap, debt0)
        counted = Math.min(liquid0, capEff)
        if (liquid0 > capEff + EPS && s.offsetSaturatedMonth === null) s.offsetSaturatedMonth = m
      }

      let interest = 0
      let principal = 0
      if (debt0 > 0) {
        interest = ((debt0 - counted) * s.rate) / 12
        const scheduled =
          s.id === 'B' && offset.mode === 'lowerPayment'
            ? s.annuity - (debt0 * s.rate) / 12
            : s.annuity - interest
        principal = Math.min(debt0, scheduled)
        if (debt0 - principal <= EPS) {
          principal = debt0
          s.payoffMonth = m
        }
        s.debt = debt0 - principal
      }
      const payment = interest + principal

      const pool = liquid0 - counted
      const gross =
        s.id === 'A'
          ? (Math.max(0, pool) * savings.currentAccountRate) / 12
          : savingsInterestGross(pool, savings.accounts, savings.currentAccountRate)
      const net = gross * (1 - tax.savingsInterestTax)

      s.liquid = liquid0 + budget - payment + net
      s.yearInterest += interest
      s.interestPaid += interest
      s.savingsInterestNet += net

      let refund = 0
      let prepay = 0
      let fee = 0
      if (m % 12 === 0) {
        if (tax.deductMortgageInterest) {
          refund = Math.min(s.yearInterest, tax.deductionCap) * tax.incomeTaxRate
        }
        s.yearInterest = 0
        s.liquid += refund
        s.taxRefund += refund
      }

      if (s.id === 'D' && s.debt > 0 && pre.annual) {
        const atFixationEnd = m === F && F < n
        if (atFixationEnd || m % 12 === 0) {
          const avail = s.liquid - pre.reserve
          if (avail > 0) {
            if (atFixationEnd) {
              prepay = Math.min(avail, s.debt)
            } else {
              const free = pre.freeAnnualShare * P
              const x = avail <= free ? avail : free + (avail - free) / (1 + pre.feeRate)
              prepay = Math.min(x, s.debt)
              fee = pre.feeRate * Math.max(0, prepay - free)
            }
            s.debt -= prepay
            s.liquid -= prepay + fee
            s.prepaymentFees += fee
            if (s.debt <= EPS) {
              s.debt = 0
              s.payoffMonth = m
            } else if (pre.mode === 'lowerPayment') {
              s.annuity = annuity(s.debt, s.rate, n - m)
            }
          }
        }
      }

      if (s.liquid < -0.005 && s.negativeLiquidMonth === null) s.negativeLiquidMonth = m

      s.rows.push({
        month: m,
        budget,
        payment,
        interest,
        principal,
        prepayment: prepay,
        prepaymentFee: fee,
        savingsInterestNet: net,
        taxRefund: refund,
        counted,
        debt: s.debt,
        liquid: s.liquid,
        netWorth: s.liquid - s.debt,
      })
    }
  }

  const realFactor = (1 + inputs.inflation) ** (H / 12)
  const scenarios = {} as SimulationResult['scenarios']
  for (const s of states) {
    const netWorth = s.liquid - s.debt
    const summary: ScenarioSummary = {
      netWorth,
      netWorthReal: netWorth / realFactor,
      debt: s.debt,
      liquid: s.liquid,
      interestPaid: s.interestPaid,
      taxRefund: s.taxRefund,
      savingsInterestNet: s.savingsInterestNet,
      prepaymentFees: s.prepaymentFees,
      payoffMonth: s.payoffMonth,
      offsetSaturatedMonth: s.offsetSaturatedMonth,
      negativeLiquidMonth: s.negativeLiquidMonth,
    }
    scenarios[s.id] = { rows: s.rows, summary }
  }

  // Rank by net worth rounded to haléře; ties keep the order A, B, C, D (stable sort).
  const key = (id: ScenarioId) => Math.round(scenarios[id].summary.netWorth * 100)
  const ranking = [...SCENARIO_IDS].sort((a, b) => key(b) - key(a))

  return { budgets, scenarios, ranking }
}
