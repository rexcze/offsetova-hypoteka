import type { Warning } from '../../engine/analysis.ts'
import type { ScenarioId } from '../../engine/types.ts'
import { formatCzk, formatPercent, formatYears } from '../format.ts'
import { SCENARIO_LABELS } from '../labels.ts'

export type WarningLevel = 'warning' | 'info'

export interface WarningText {
  level: WarningLevel
  text: string
}

/** Czech text for a warning. `money` formats horizon amounts (nominal or in today's CZK). */
export function warningText(w: Warning, money: (nominal: number) => string): WarningText {
  const p = w.params
  switch (w.code) {
    case 'OFFSET_SATURATED':
      return {
        level: 'warning',
        text: `Od ${p.month}. měsíce máte na offsetovém účtu víc, než banka započítá. Přebytek počítáme na spořicích účtech.`,
      }
    case 'NEGATIVE_LIQUID':
      return {
        level: 'warning',
        text: `Scénáři „${SCENARIO_LABELS[p.scenario as ScenarioId]}“ se od ${p.month}. měsíce nedostává peněz (záporné likvidní peníze).`,
      }
    case 'BEYOND_FIXATION_NO_RATE':
      return {
        level: 'warning',
        text: `Horizont (${formatYears(Number(p.horizonYears))}) je delší než fixace (${formatYears(Number(p.fixationYears))}), ale sazba po fixaci není zadaná. Počítáme s nezměněnou sazbou.`,
      }
    case 'D_LOWER_LIQUIDITY':
      return {
        level: 'info',
        text: `Při mimořádných splátkách máte na konci k dispozici ${money(Number(p.liquidD))} likvidních peněz, s offsetem ${money(Number(p.liquidB))}. Peníze na offsetu zůstávají dostupné, splacený úvěr zpět nezískáte.`,
      }
    case 'DEDUCTION_REDUCED':
      return {
        level: 'info',
        text: `Úroky z offsetové hypotéky za 1. rok (${formatCzk(Number(p.interest))}) jsou pod stropem odpočtu (${formatCzk(Number(p.deductionCap))}), takže offset snižuje i daňový odpočet. Výpočet to zohledňuje.`,
      }
    case 'NO_SAVINGS_ACCOUNTS':
      return { level: 'info', text: 'Nemáte žádný spořicí účet, scénář C je proto stejný jako A.' }
    case 'OFFSET_RATE_BELOW_CLASSIC':
      return {
        level: 'warning',
        text: `Sazba offsetové hypotéky (${formatPercent(Number(p.offsetRate))}) je nižší než klasické (${formatPercent(Number(p.classicRate))}). Ověřte, že je to správně.`,
      }
  }
}
