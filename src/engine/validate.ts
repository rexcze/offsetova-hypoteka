import type { Inputs, ValidationError } from './types.ts'

const MAX_RATE = 0.25

export function validate(inputs: Inputs): ValidationError[] {
  const errors: ValidationError[] = []
  const add = (path: string, message: string) => errors.push({ path, message })

  const finite = (path: string, v: number): boolean => {
    if (Number.isFinite(v)) return true
    add(path, 'Zadejte číslo.')
    return false
  }
  const int = (path: string, v: number, min: number, max: number, label: string) => {
    if (!finite(path, v)) return
    if (!Number.isInteger(v) || v < min || v > max)
      add(path, `${label} musí být celé číslo od ${min} do ${max}.`)
  }
  const pct = (x: number) => Number((x * 100).toFixed(2))
  const range = (path: string, v: number, min: number, max: number, label: string) => {
    if (!finite(path, v)) return
    if (v < min || v > max) add(path, `${label} musí být od ${pct(min)} % do ${pct(max)} %.`)
  }
  const rate = (path: string, v: number, label: string) => range(path, v, 0, MAX_RATE, label)
  const nonNegative = (path: string, v: number, label: string) => {
    if (finite(path, v) && v < 0) add(path, `${label} nesmí být záporná.`)
  }

  const { loan, offset, savings, prepayment, tax } = inputs

  if (finite('loan.principal', loan.principal) && loan.principal <= 0) {
    add('loan.principal', 'Výše úvěru musí být kladná.')
  }
  int('loan.termYears', loan.termYears, 1, 40, 'Splatnost')
  int('loan.fixationYears', loan.fixationYears, 1, Math.max(1, loan.termYears), 'Fixace')
  int('horizonYears', inputs.horizonYears, 1, Math.max(1, loan.termYears), 'Horizont')
  rate('loan.classicRate', loan.classicRate, 'Sazba klasické hypotéky')
  rate('loan.offsetRate', loan.offsetRate, 'Sazba offsetové hypotéky')
  if (loan.rateAfterFixation !== null)
    rate('loan.rateAfterFixation', loan.rateAfterFixation, 'Sazba po fixaci')

  if (offset.cap !== null && finite('offset.cap', offset.cap) && offset.cap <= 0) {
    add('offset.cap', 'Strop musí být kladný, nebo nechte pole prázdné.')
  }

  nonNegative('savings.initial', savings.initial, 'Částka')
  nonNegative('savings.monthlyDeposit', savings.monthlyDeposit, 'Vklad')
  nonNegative('prepayment.reserve', prepayment.reserve, 'Rezerva')
  range('savings.depositGrowth', savings.depositGrowth, -0.1, 0.2, 'Navýšení vkladu')
  rate('savings.currentAccountRate', savings.currentAccountRate, 'Sazba běžného účtu')
  range('inflation', inputs.inflation, -0.05, 0.3, 'Inflace')
  range('prepayment.freeAnnualShare', prepayment.freeAnnualShare, 0, 1, 'Bezplatný limit')
  range('prepayment.feeRate', prepayment.feeRate, 0, 0.1, 'Poplatek')
  range('tax.savingsInterestTax', tax.savingsInterestTax, 0, 1, 'Daň z úroků')
  range('tax.incomeTaxRate', tax.incomeTaxRate, 0, 1, 'Sazba daně z příjmu')
  nonNegative('tax.deductionCap', tax.deductionCap, 'Strop odpočtu')

  if (savings.accounts.length > 5) add('savings.accounts', 'Nejvýše 5 spořicích účtů.')
  savings.accounts.forEach((account, a) => {
    const base = `savings.accounts.${a}.tiers`
    if (account.tiers.length === 0) {
      add(base, 'Účet musí mít aspoň jedno pásmo.')
      return
    }
    let prevUpTo = 0
    let prevRate = Infinity
    account.tiers.forEach((tier, t) => {
      const path = `${base}.${t}`
      const isLast = t === account.tiers.length - 1
      rate(`${path}.rate`, tier.rate, 'Sazba pásma')
      if (Number.isFinite(tier.rate)) {
        if (tier.rate > prevRate) add(`${path}.rate`, 'Sazba nesmí být vyšší než u předchozího pásma.')
        prevRate = tier.rate
      }
      if (tier.upTo === null) {
        if (!isLast) add(`${path}.upTo`, 'Pásmo bez hranice může být jen poslední.')
      } else if (finite(`${path}.upTo`, tier.upTo)) {
        if (tier.upTo <= 0) add(`${path}.upTo`, 'Hranice pásma musí být kladná.')
        else if (tier.upTo <= prevUpTo)
          add(`${path}.upTo`, 'Hranice pásma musí být vyšší než u předchozího pásma.')
        prevUpTo = Math.max(prevUpTo, tier.upTo)
      }
    })
  })

  return errors
}
