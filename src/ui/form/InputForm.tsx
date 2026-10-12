import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCzk, formatPercent, formatYears } from '../format.ts'
import { Accounts } from './Accounts.tsx'
import { useForm } from './context.ts'
import { CheckField, NumberField, PathCheckField, SelectField, SliderField, SliderInput } from './fields.tsx'
import { simpleSavingsRate, surchargePoints } from './selectors.ts'
import { SIMPLE_RATE_PATH } from './state.ts'
import { formatInputNumber, parseNumber } from '../format.ts'

const MODE_B = [
  { value: 'shortenTerm', label: 'Zkracuje dobu splácení' },
  { value: 'lowerPayment', label: 'Snižuje splátku' },
] as const

const MODE_D = [
  { value: 'shortenTerm', label: 'Zkrátí dobu splácení' },
  { value: 'lowerPayment', label: 'Sníží splátku' },
] as const

type Section = 'loan' | 'savings' | 'prepayment' | 'tax'

/** The advanced section that holds the field with a validation error (the simple rate is not advanced). */
function sectionOf(path: string): Section | null {
  if (path === SIMPLE_RATE_PATH) return null
  if (['loan.termYears', 'loan.rateAfterFixation', 'offset.cap', 'offset.mode'].includes(path)) return 'loan'
  if (path.startsWith('savings.accounts') || path.startsWith('savings.depositGrowth')) return 'savings'
  if (path === 'savings.currentAccountRate') return 'savings'
  if (path.startsWith('prepayment.')) return 'prepayment'
  if (path.startsWith('tax.') || path === 'inflation') return 'tax'
  return null
}

function SurchargeBadge() {
  const { state } = useForm()
  const points = surchargePoints(state.inputs)
  if (!Number.isFinite(points)) return null
  const abs = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.abs(points),
  )
  return (
    <Badge
      variant="secondary"
      className="ml-auto bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
    >
      {points < 0 ? '−' : '+'}
      {abs} p. b.
    </Badge>
  )
}

/** The savings rate slider edits the first tier of the first account. */
function SavingsRateField() {
  const { state, dispatch, errors } = useForm()
  const { rate, hasMoreTiers } = simpleSavingsRate(state.inputs)
  const onText = (text: string) => {
    const parsed = parseNumber(text)
    dispatch({
      type: 'simpleSavingsRate',
      rate: parsed === null ? NaN : Number((parsed / 100).toPrecision(12)),
      text,
    })
  }
  return (
    <SliderInput
      id="f-simple-savings-rate"
      label="Úrok vašeho spořicího účtu"
      value={rate}
      min={0}
      max={7}
      step={0.05}
      scale={100}
      unit="% p. a."
      hint="Roční úrok před zdaněním."
      text={state.texts[SIMPLE_RATE_PATH] ?? formatInputNumber(rate, 100)}
      error={errors[SIMPLE_RATE_PATH] ?? errors['savings.accounts.0.tiers.1.rate']}
      formatValue={(v) => formatPercent(v)}
      onText={onText}
      onSlider={(displayed) => onText(formatInputNumber(displayed / 100, 100))}
      note={
        hasMoreTiers && (
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
            Z části úspor nad hranicí platí nižší sazba, viz Upřesnit spoření.
          </p>
        )
      }
    />
  )
}

function OffsetRateField() {
  const { state, dispatch } = useForm()
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <CheckField
        id="f-offsetRateDiffers"
        label={
          <>
            Banka nabízí u offsetu <b>jinou sazbu</b>
          </>
        }
        hint="Jinak počítáme se stejnou sazbou jako u klasické hypotéky."
        checked={state.offsetRateDiffers}
        onChange={(value) => dispatch({ type: 'offsetRateDiffers', value })}
      />
      {state.offsetRateDiffers && (
        <div className="mt-3">
          <NumberField
            path="loan.offsetRate"
            label="Úroková sazba offsetové hypotéky"
            unit="% p. a."
            scale={100}
            hint="Celá sazba, jak ji uvádí banka. Štítek ukazuje rozdíl proti klasické hypotéce."
            extra={
              <div className="flex">
                <SurchargeBadge />
              </div>
            }
          />
        </div>
      )}
    </div>
  )
}

/** Fixation options plus the current value, so a value from a link is never lost. */
function fixationOptions(current: number): { value: number; label: string }[] {
  const values = new Set([1, 2, 3, 5, 7, 10])
  if (Number.isInteger(current) && current >= 1) values.add(current)
  return [...values].sort((a, b) => a - b).map((n) => ({ value: n, label: formatYears(n) }))
}

function horizonOptions(term: number, current: number): { value: number; label: string }[] {
  const max = Number.isInteger(term) && term >= 1 ? term : 30
  const values = new Set(Array.from({ length: max }, (_, i) => i + 1))
  if (Number.isInteger(current) && current >= 1) values.add(current)
  return [...values].sort((a, b) => a - b).map((n) => ({ value: n, label: formatYears(n) }))
}

export function InputForm() {
  const { state, dispatch, errors } = useForm()
  const [open, setOpen] = useState<string[]>([])
  const errorSections = new Set(
    Object.keys(errors)
      .map(sectionOf)
      .filter((s) => s !== null),
  )
  const openSections = [...new Set([...open, ...errorSections])]
  const { inputs } = state

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
      <Card className="gap-0 py-5">
        <CardHeader className="flex flex-row items-center justify-between px-5 pb-4">
          <CardTitle className="text-base">Základní údaje</CardTitle>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => dispatch({ type: 'example' })}
          >
            Vyzkoušet na příkladu
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 px-5">
          <SliderField
            path="loan.principal"
            label="Výše úvěru"
            min={500_000}
            max={12_000_000}
            step={100_000}
            grouped
            unit="Kč"
            formatValue={formatCzk}
          />
          <SliderField
            path="loan.classicRate"
            label="Úroková sazba hypotéky"
            min={0}
            max={10}
            step={0.01}
            scale={100}
            unit="% p. a."
            hint="Roční sazba z vaší smlouvy nebo nabídky."
            formatValue={(v) => formatPercent(v)}
          />
          <OffsetRateField />
          <SliderField
            path="savings.initial"
            label="Kolik máte úspor"
            min={0}
            max={4_000_000}
            step={50_000}
            grouped
            unit="Kč"
            formatValue={formatCzk}
          />
          <SliderField
            path="savings.monthlyDeposit"
            label="Kolik měsíčně spoříte"
            min={0}
            max={50_000}
            step={500}
            grouped
            unit="Kč"
            hint="Částka, kterou každý měsíc odložíte."
            formatValue={formatCzk}
          />
          <SavingsRateField />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              path="loan.fixationYears"
              label="Fixace"
              asText
              options={fixationOptions(inputs.loan.fixationYears)}
              hint="Na jak dlouho je sazba pevná."
            />
            <SelectField
              path="horizonYears"
              label="Porovnat za"
              asText
              options={horizonOptions(inputs.loan.termYears, inputs.horizonYears)}
              hint="Za kolik let se výsledky porovnávají."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <Accordion type="multiple" value={openSections} onValueChange={setOpen}>
          <AccordionItem value="loan" className="px-5">
            <AccordionTrigger>Upřesnit hypotéku a offset</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <NumberField path="loan.termYears" label="Splatnost" unit="let" />
              <NumberField
                path="loan.rateAfterFixation"
                label="Sazba klasické hypotéky po fixaci"
                unit="% p. a."
                scale={100}
                optional
                hint="Nepovinné. Prázdné pole = sazba se nezmění. Offset dostane stejný rozdíl sazeb."
              />
              <NumberField
                path="offset.cap"
                label="Strop započtených úspor"
                unit="Kč"
                grouped
                optional
                hint="Nepovinné. Nejvyšší částka, kterou banka započte proti dluhu. Prázdné = bez limitu."
              />
              <SelectField
                path="offset.mode"
                label="Co dělá ušetřený úrok"
                options={[...MODE_B]}
                hint="Mechanika se liší podle banky. Ověřte ji u své banky."
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="savings" className="border-t px-5">
            <AccordionTrigger>Upřesnit spoření</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <NumberField
                path="savings.depositGrowth"
                label="Roční navýšení vkladu"
                unit="%"
                scale={100}
                extra={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch({ type: 'growthFromInflation' })}
                  >
                    = inflace ({formatPercent(inputs.inflation)})
                  </Button>
                }
              />
              <NumberField
                path="savings.currentAccountRate"
                label="Sazba běžného účtu"
                unit="% p. a."
                scale={100}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Spořicí účty</p>
                <Accounts />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="prepayment" className="border-t px-5">
            <AccordionTrigger>Upřesnit mimořádné splátky</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <NumberField
                path="prepayment.reserve"
                label="Rezerva"
                unit="Kč"
                grouped
                hint="Částka, kterou nikdy nesplácíte. Leží na spořicích účtech."
              />
              <PathCheckField
                path="prepayment.initial"
                label="Snížit úvěr hned na začátku úsporami nad rezervu"
              />
              <PathCheckField
                path="prepayment.annual"
                label="Splácet průběžně (k výročí a na konci fixace)"
              />
              <NumberField
                path="prepayment.freeAnnualShare"
                label="Bezplatný limit"
                unit="% původní jistiny"
                scale={100}
                hint="Podíl původní jistiny, který lze ročně splatit zdarma."
              />
              <NumberField
                path="prepayment.feeRate"
                label="Poplatek z části nad limit"
                unit="%"
                scale={100}
              />
              <SelectField path="prepayment.mode" label="Co dělá mimořádná splátka" options={[...MODE_D]} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tax" className="border-t px-5">
            <AccordionTrigger>Upřesnit daně a inflaci</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <NumberField path="tax.savingsInterestTax" label="Daň z úroků" unit="%" scale={100} />
              <PathCheckField path="tax.deductMortgageInterest" label="Uplatňuji odpočet úroků z hypotéky" />
              <SelectField
                path="tax.incomeTaxRate"
                label="Sazba daně z příjmu"
                options={[
                  { value: 0.15, label: '15 %' },
                  { value: 0.23, label: '23 %' },
                ]}
              />
              <SelectField
                path="tax.deductionCap"
                label="Strop odpočtu"
                options={[
                  { value: 150_000, label: '150 000 Kč' },
                  { value: 300_000, label: '300 000 Kč' },
                ]}
                hint="150 000 Kč platí pro smlouvy od roku 2021, 300 000 Kč pro starší. Strop je na domácnost a pravidla se mohou změnit."
              />
              <NumberField
                path="inflation"
                label="Inflace"
                unit="% p. a."
                scale={100}
                hint="Slouží jen k přepočtu do dnešních korun, pořadí scénářů neovlivní."
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <Button type="button" variant="outline" onClick={() => dispatch({ type: 'reset' })}>
        Obnovit výchozí hodnoty
      </Button>
    </form>
  )
}
