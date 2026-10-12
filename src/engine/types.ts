export interface SavingsAccount {
  name: string
  /** Cumulative upper bounds; only the last tier may have `upTo: null` (unlimited). */
  tiers: { upTo: number | null; rate: number }[]
}

export type MortgageMode = 'shortenTerm' | 'lowerPayment'

export interface Inputs {
  loan: {
    principal: number
    termYears: number
    fixationYears: number
    classicRate: number
    offsetRate: number
    /** Classic rate after fixation; the offset rate becomes this plus the surcharge. null = unchanged. */
    rateAfterFixation: number | null
  }
  offset: {
    mode: MortgageMode
    /** Maximum amount the bank counts against the debt; null = no limit. */
    cap: number | null
  }
  savings: {
    initial: number
    monthlyDeposit: number
    depositGrowth: number
    currentAccountRate: number
    accounts: SavingsAccount[]
  }
  prepayment: {
    reserve: number
    initial: boolean
    annual: boolean
    freeAnnualShare: number
    feeRate: number
    mode: MortgageMode
  }
  tax: {
    savingsInterestTax: number
    deductMortgageInterest: boolean
    incomeTaxRate: number
    deductionCap: number
  }
  horizonYears: number
  inflation: number
}

export type ScenarioId = 'A' | 'B' | 'C' | 'D'

export interface MonthRow {
  month: number
  budget: number
  payment: number
  interest: number
  principal: number
  prepayment: number
  prepaymentFee: number
  savingsInterestNet: number
  taxRefund: number
  counted: number
  debt: number
  liquid: number
  netWorth: number
}

export interface ScenarioSummary {
  netWorth: number
  netWorthReal: number
  debt: number
  liquid: number
  interestPaid: number
  taxRefund: number
  savingsInterestNet: number
  prepaymentFees: number
  payoffMonth: number | null
  offsetSaturatedMonth: number | null
  negativeLiquidMonth: number | null
}

export interface SimulationResult {
  budgets: number[]
  scenarios: Record<ScenarioId, { rows: MonthRow[]; summary: ScenarioSummary }>
  ranking: ScenarioId[]
}

export interface ValidationError {
  path: string
  message: string
}
