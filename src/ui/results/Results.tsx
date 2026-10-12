import { useMemo } from 'react'
import { crossovers, marginalRates, offsetVsBest, toReal, warnings } from '../../engine/analysis.ts'
import type { Inputs, ScenarioId, SimulationResult } from '../../engine/types.ts'
import { AdvantageChart } from '../charts/AdvantageChart.tsx'
import { BreakEvenGridView } from '../charts/BreakEvenGridView.tsx'
import { formatCzk, formatPercent, formatYears } from '../format.ts'
import { SCENARIO_LABELS } from '../labels.ts'
import { warningText } from './warningText.ts'

interface Props {
  inputs: Inputs
  result: SimulationResult
  showReal: boolean
  hasErrors: boolean
}

const ASSUMPTIONS = [
  'Mechanika offsetu se liší podle banky (co se započítává, strop, zda klesá splátka, nebo se zkracuje splatnost). Ověřte ji u své banky.',
  'Úrok ze spoření se počítá z počátečního zůstatku měsíce a připisuje se měsíčně. Při pásmovém úročení se nižší sazbou úročí jen část nad hranicí.',
  'Peníze se mezi spořicími účty přesouvají optimálně každý měsíc.',
  'Odpočet úroků se počítá po smluvních letech a vratka přijde hned na konci roku. Strop odpočtu je na domácnost.',
  'Poplatek za mimořádnou splátku je zjednodušený. Na konci fixace je mimořádná splátka zdarma.',
  'Po refixaci se splátka přepočte na zbývající původní splatnost.',
  'Nezahrnuje poplatky za vedení účtů, pojištění ani jednorázové výdaje.',
]

function payoffText(month: number | null): string {
  if (month === null) return 'ne do horizontu'
  if (month === 0) return 'hned na začátku'
  return `měsíc ${month} (${Math.ceil(month / 12)}. rok)`
}

export function Results({ inputs, result, showReal, hasErrors }: Props) {
  const months = inputs.horizonYears * 12
  const money = (nominal: number) => formatCzk(showReal ? toReal(nominal, months, inputs.inflation) : nominal)

  const analysis = useMemo(() => {
    const diff = offsetVsBest(result)
    return {
      crossings: crossovers(diff).map((m) => ({ month: m, offsetWins: diff[m - 1]! > 0 })),
      warnings: warnings(inputs, result),
      rates: marginalRates(inputs, result),
    }
  }, [inputs, result])

  const nw = (id: ScenarioId) => result.scenarios[id].summary.netWorth
  const [winner, second] = result.ranking as [ScenarioId, ScenarioId]
  const lead = Math.abs(
    (showReal ? toReal(nw(winner), months, inputs.inflation) : nw(winner)) -
      (showReal ? toReal(nw(second), months, inputs.inflation) : nw(second)),
  )
  const tie = Math.round(nw(winner) * 100) === Math.round(nw(second) * 100)
  const offsetVsC = nw('B') - nw('C')
  const offsetVsCText =
    Math.round(offsetVsC * 100) === 0
      ? 'Offset vychází proti spořicím účtům stejně.'
      : `Offset je proti spořicím účtům ${offsetVsC > 0 ? 'lepší' : 'horší'} o ${money(Math.abs(offsetVsC))}.`
  const { rates } = analysis
  const hasDeductionNote = analysis.warnings.some((w) => w.code === 'DEDUCTION_REDUCED')

  return (
    <section className="results" aria-live="polite">
      {hasErrors && (
        <p className="banner">Opravte zvýrazněná pole. Výsledky zatím platí pro poslední platné hodnoty.</p>
      )}

      <div className="verdict card">
        <h2>
          Za {formatYears(inputs.horizonYears)} vychází nejlépe: {SCENARIO_LABELS[winner]}
        </h2>
        <p>
          {tie
            ? `Rozdíl proti druhému (${SCENARIO_LABELS[second]}) je zanedbatelný.`
            : `O ${money(lead)} víc než ${SCENARIO_LABELS[second]}.`}
        </p>
        <p>{offsetVsCText}</p>
        {analysis.crossings.map((c) => (
          <p key={c.month}>
            {c.offsetWins ? 'Offset začne vyhrávat' : 'Offset přestane být nejlepší'} v{' '}
            {Math.ceil(c.month / 12)}. roce (měsíc {c.month}).
          </p>
        ))}
        {showReal && <p className="hint">Částky jsou v dnešních korunách.</p>}
      </div>

      {analysis.warnings.length > 0 && (
        <ul className="warnings">
          {analysis.warnings.map((w, i) => {
            const t = warningText(w, money)
            return (
              <li key={`${w.code}-${i}`} className={t.level}>
                <strong>{t.level === 'warning' ? 'Upozornění: ' : 'Informace: '}</strong>
                {t.text}
              </li>
            )
          })}
        </ul>
      )}

      <h2>
        Srovnání scénářů po {formatYears(inputs.horizonYears)}
        {showReal ? ' (v dnešních korunách)' : ''}
      </h2>
      <div className="table-wrap">
        <table className="scenarios" aria-label="Srovnání scénářů">
          <thead>
            <tr>
              <th scope="col">Scénář</th>
              <th scope="col">Čisté jmění</th>
              <th scope="col">Zbývající dluh</th>
              <th scope="col">Likvidní peníze</th>
              <th scope="col">Zaplacené úroky</th>
              <th scope="col">Daňová vratka</th>
              <th scope="col">Čistý úrok ze spoření</th>
              <th scope="col">Poplatky</th>
              <th scope="col">Splaceno</th>
            </tr>
          </thead>
          <tbody>
            {result.ranking.map((id, i) => {
              const s = result.scenarios[id].summary
              return (
                <tr key={id} className={i === 0 ? 'winner' : undefined}>
                  <th scope="row" className={`sc-${id}`}>
                    <span className="swatch" aria-hidden="true" /> {i + 1}. {SCENARIO_LABELS[id]}
                    {i === 0 && <span className="badge">nejlepší</span>}
                    {id === 'D' && (
                      <small className="hint">
                        Úspory nad rezervu ({formatCzk(inputs.prepayment.reserve)}) šly na splátky úvěru, k
                        dispozici je jen rezerva.
                      </small>
                    )}
                  </th>
                  <td data-label="Čisté jmění">
                    <strong>{money(s.netWorth)}</strong>
                  </td>
                  <td data-label="Zbývající dluh">{money(s.debt)}</td>
                  <td data-label="Likvidní peníze">{money(s.liquid)}</td>
                  <td data-label="Zaplacené úroky">{money(s.interestPaid)}</td>
                  <td data-label="Daňová vratka">{money(s.taxRefund)}</td>
                  <td data-label="Čistý úrok ze spoření">{money(s.savingsInterestNet)}</td>
                  <td data-label="Poplatky">{money(s.prepaymentFees)}</td>
                  <td data-label="Splaceno">{payoffText(s.payoffMonth)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AdvantageChart inputs={inputs} result={result} showReal={showReal} />
      <BreakEvenGridView inputs={inputs} showReal={showReal} />

      <div className="why card">
        <h2>Proč to tak vychází</h2>
        <ul>
          <li>Každá koruna na offsetu vám ušetří {formatPercent(rates.offset)} ročně.</li>
          <li>Na spořicím účtu vydělá {formatPercent(rates.savings)} po zdanění.</li>
          <li>Mimořádná splátka ušetří {formatPercent(rates.prepayment)} ročně.</li>
          <li>Přirážka offsetu vás stojí asi {formatCzk(rates.surchargeCostPerYear)} ročně.</li>
          {hasDeductionNote && (
            <li>
              Úroky z hypotéky jsou pod stropem odpočtu, proto se každá ušetřená koruna úroku projeví i v
              nižším daňovém odpočtu. Sazby výše jsou už snížené o daň z příjmu.
            </li>
          )}
        </ul>
      </div>

      <details className="assumptions">
        <summary>Předpoklady a zjednodušení</summary>
        <ul>
          {ASSUMPTIONS.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>
      <p className="hint">
        Kalkulačka je orientační a nejde o finanční poradenství. Podmínky offsetu ověřte u své banky. Pravidla
        a sazby se mohou změnit.
      </p>
    </section>
  )
}
