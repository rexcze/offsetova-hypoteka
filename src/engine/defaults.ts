import type { Inputs } from './types.ts'

export function defaultInputs(): Inputs {
  return {
    loan: {
      principal: 4_000_000,
      termYears: 30,
      fixationYears: 5,
      classicRate: 0.0489,
      offsetRate: 0.0519,
      rateAfterFixation: null,
    },
    offset: { mode: 'shortenTerm', cap: null },
    savings: {
      initial: 300_000,
      monthlyDeposit: 0,
      depositGrowth: 0,
      currentAccountRate: 0,
      accounts: [
        {
          name: 'Spořicí účet',
          tiers: [
            { upTo: 300_000, rate: 0.035 },
            { upTo: null, rate: 0.02 },
          ],
        },
      ],
    },
    prepayment: {
      reserve: 100_000,
      initial: true,
      annual: true,
      freeAnnualShare: 0,
      feeRate: 0.01,
      mode: 'shortenTerm',
    },
    tax: {
      savingsInterestTax: 0.15,
      deductMortgageInterest: true,
      incomeTaxRate: 0.15,
      deductionCap: 150_000,
    },
    horizonYears: 5,
    inflation: 0.025,
  }
}
