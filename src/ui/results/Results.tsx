import { AlertTriangle, Info, Lightbulb } from 'lucide-react'
import { useMemo } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { crossovers, marginalRates, offsetVsBest, warnings } from '../../engine/analysis.ts'
import type { Inputs, SimulationResult } from '../../engine/types.ts'
import { AdvantageChart } from '../charts/AdvantageChart.tsx'
import { BreakEvenGridView } from '../charts/BreakEvenGridView.tsx'
import { formatAfterYears, formatCzk, formatPercent, formatYears } from '../format.ts'
import { SCENARIO_LABELS } from '../labels.ts'
import { Calendar } from './Calendar.tsx'
import { RealToggle } from './RealToggle.tsx'
import { ScenarioCards } from './ScenarioCards.tsx'
import { ScenarioTable } from './ScenarioTable.tsx'
import { VERDICT_ID } from './StickySummary.tsx'
import { type Summary } from './summary.ts'
import { warningText } from './warningText.ts'

interface Props {
  inputs: Inputs
  result: SimulationResult
  summary: Summary
  showReal: boolean
  onShowRealChange: (value: boolean) => void
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

export function Results({ inputs, result, summary, showReal, onShowRealChange, hasErrors }: Props) {
  const { money, winner, second, lead, tie } = summary

  const analysis = useMemo(() => {
    const diff = offsetVsBest(result)
    return {
      crossings: crossovers(diff).map((m) => ({ month: m, offsetWins: diff[m - 1]! > 0 })),
      warnings: warnings(inputs, result),
      rates: marginalRates(inputs, result),
    }
  }, [inputs, result])

  const offsetVsC = summary.offsetVsSavings
  const offsetVsCText =
    Math.round(offsetVsC * 100) === 0
      ? 'Offset vychází proti spořicím účtům stejně.'
      : `Offset je proti spořicím účtům ${offsetVsC > 0 ? 'lepší' : 'horší'} o ${money(Math.abs(offsetVsC))}.`
  const { rates } = analysis
  const hasDeductionNote = analysis.warnings.some((w) => w.code === 'DEDUCTION_REDUCED')

  return (
    <section className="@container space-y-6" aria-live="polite">
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <div>Opravte zvýrazněná pole. Výsledky zatím platí pro poslední platné hodnoty.</div>
        </Alert>
      )}

      <div
        id={VERDICT_ID}
        className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-card p-6 shadow-sm"
      >
        <p className="text-sm font-medium text-primary">
          Za {formatYears(inputs.horizonYears)} vychází nejlépe
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{SCENARIO_LABELS[winner]}</h2>
        <div className="mt-2 space-y-1 text-muted-foreground">
          <p>
            {tie ? (
              `Rozdíl proti druhému (${SCENARIO_LABELS[second]}) je zanedbatelný.`
            ) : (
              <>
                O <b className="text-foreground">{formatCzk(lead)}</b> víc než {SCENARIO_LABELS[second]}.
              </>
            )}
          </p>
          <p>{offsetVsCText}</p>
          {analysis.crossings.map((c) => (
            <p key={c.month}>
              {c.offsetWins ? 'Offset začne vyhrávat' : 'Offset přestane být nejlepší'} v{' '}
              {Math.ceil(c.month / 12)}. roce (měsíc {c.month}).
            </p>
          ))}
          {showReal && <p className="text-xs">Částky jsou v dnešních korunách.</p>}
        </div>
      </div>

      {analysis.warnings.length > 0 && (
        <ul className="space-y-2">
          {analysis.warnings.map((w, i) => {
            const t = warningText(w, money)
            const isWarning = t.level === 'warning'
            return (
              <li key={`${w.code}-${i}`}>
                <Alert
                  role={isWarning ? 'alert' : 'status'}
                  className={cn(
                    isWarning &&
                      'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
                  )}
                >
                  {isWarning ? <AlertTriangle aria-hidden="true" /> : <Info aria-hidden="true" />}
                  <div>
                    <strong>{isWarning ? 'Upozornění: ' : 'Informace: '}</strong>
                    {t.text}
                  </div>
                </Alert>
              </li>
            )
          })}
        </ul>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">
            Srovnání scénářů {formatAfterYears(inputs.horizonYears)}
            {showReal ? ' (v dnešních korunách)' : ''}
          </h2>
          <RealToggle id="f-showReal" checked={showReal} onChange={onShowRealChange} />
        </div>
        <ScenarioCards inputs={inputs} result={result} summary={summary} />
      </div>

      <AdvantageChart
        inputs={inputs}
        result={result}
        showReal={showReal}
        onShowRealChange={onShowRealChange}
      />
      <BreakEvenGridView inputs={inputs} showReal={showReal} />

      <Card className="gap-0 py-5">
        <CardHeader className="px-5 pb-3">
          <CardTitle className="text-base">Proč to tak vychází</CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              <>
                Každá koruna na offsetu vám ušetří{' '}
                <b className="text-foreground">{formatPercent(rates.offset)}</b> ročně.
              </>,
              <>
                Na spořicím účtu vydělá <b className="text-foreground">{formatPercent(rates.savings)}</b> po
                zdanění.
              </>,
              <>
                Mimořádná splátka ušetří <b className="text-foreground">{formatPercent(rates.prepayment)}</b>{' '}
                ročně.
              </>,
              <>
                Přirážka offsetu vás stojí asi{' '}
                <b className="text-foreground">{formatCzk(rates.surchargeCostPerYear)}</b> ročně.
              </>,
              ...(hasDeductionNote
                ? [
                    <>
                      Úroky z hypotéky jsou pod stropem odpočtu, proto se každá ušetřená koruna úroku projeví
                      i v nižším daňovém odpočtu. Sazby výše jsou už snížené o daň z příjmu.
                    </>,
                  ]
                : []),
            ].map((sentence, i) => (
              <li key={i} className="flex gap-2">
                <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{sentence}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Kalkulačka je orientační a nejde o finanční poradenství. Podmínky offsetu ověřte u své banky.
            Pravidla a sazby se mohou změnit.
          </p>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <Accordion type="multiple">
          <AccordionItem value="table" className="px-5">
            <AccordionTrigger>Srovnání v tabulce</AccordionTrigger>
            <AccordionContent>
              <ScenarioTable inputs={inputs} result={result} summary={summary} showReal={showReal} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="course" className="border-t px-5">
            <AccordionTrigger>Podrobný průběh{showReal ? ' (v dnešních korunách)' : ''}</AccordionTrigger>
            <AccordionContent>
              <Calendar result={result} inflation={inputs.inflation} showReal={showReal} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="assumptions" className="border-t px-5">
            <AccordionTrigger>Předpoklady a omezení</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                {ASSUMPTIONS.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </section>
  )
}
