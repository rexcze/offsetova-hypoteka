import { useState } from 'react'
import { formatCzk, formatPercent } from '../format.ts'
import { useForm } from './context.ts'
import { CheckField, NumberField, SelectField } from './fields.tsx'
import { MAX_ACCOUNTS, MAX_TIERS } from './state.ts'

const ADVANCED_PATHS = [
  'offset.cap',
  'savings.currentAccountRate',
  'prepayment.freeAnnualShare',
  'prepayment.feeRate',
  'tax.',
]

const MODE_B = [
  { value: 'shortenTerm', label: 'Zkracuje dobu splácení' },
  { value: 'lowerPayment', label: 'Snižuje splátku' },
] as const

const MODE_D = [
  { value: 'shortenTerm', label: 'Zkrátí dobu splácení' },
  { value: 'lowerPayment', label: 'Sníží splátku' },
] as const

function Surcharge() {
  const { state } = useForm()
  const { classicRate, offsetRate } = state.inputs.loan
  const diff = offsetRate - classicRate
  if (!Number.isFinite(diff)) return null
  const pb = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    diff * 100,
  )
  return <small className="derived">Přirážka offsetu: {pb} p. b.</small>
}

function Accounts() {
  const { state, dispatch, errors } = useForm()
  const accounts = state.inputs.savings.accounts
  return (
    <>
      {errors['savings.accounts'] && (
        <small className="error" role="alert">
          {errors['savings.accounts']}
        </small>
      )}
      {accounts.length === 0 && (
        <p className="hint">Bez spořicích účtů se úspory ve scénáři C úročí jen na běžném účtu.</p>
      )}
      {accounts.map((account, a) => {
        const tiersError = errors[`savings.accounts.${a}.tiers`]
        return (
          <div className="account" key={a}>
            <div className="account-head">
              <div className="field">
                <label htmlFor={`account-name-${a}`}>Název účtu {a + 1}</label>
                <input
                  id={`account-name-${a}`}
                  type="text"
                  value={account.name}
                  onChange={(e) =>
                    dispatch({ type: 'set', path: `savings.accounts.${a}.name`, value: e.target.value })
                  }
                />
              </div>
              <button type="button" onClick={() => dispatch({ type: 'removeAccount', account: a })}>
                Odebrat účet {a + 1}
              </button>
            </div>
            {tiersError && (
              <small className="error" role="alert">
                {tiersError}
              </small>
            )}
            {account.tiers.map((tier, t) => {
              const base = `savings.accounts.${a}.tiers.${t}`
              const prev = t > 0 ? account.tiers[t - 1]!.upTo : null
              return (
                <div className="tier" key={t}>
                  {tier.upTo === null ? (
                    <span className="tier-label">nad {prev !== null ? formatCzk(prev) : '0 Kč'}</span>
                  ) : (
                    <NumberField
                      path={`${base}.upTo`}
                      label={`Účet ${a + 1}, pásmo ${t + 1}: hranice`}
                      unit="Kč"
                      grouped
                      compact
                    />
                  )}
                  <NumberField
                    path={`${base}.rate`}
                    label={`Účet ${a + 1}, pásmo ${t + 1}: sazba`}
                    unit="% p. a."
                    scale={100}
                    compact
                  />
                  {account.tiers.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Odebrat pásmo ${t + 1} účtu ${a + 1}`}
                      onClick={() => dispatch({ type: 'removeTier', account: a, tier: t })}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
            {account.tiers.length < MAX_TIERS && (
              <button type="button" onClick={() => dispatch({ type: 'addTier', account: a })}>
                Přidat pásmo k účtu {a + 1}
              </button>
            )}
          </div>
        )
      })}
      {accounts.length < MAX_ACCOUNTS && (
        <button type="button" onClick={() => dispatch({ type: 'addAccount' })}>
          Přidat spořicí účet
        </button>
      )}
    </>
  )
}

export function InputForm() {
  const { state, dispatch, errors } = useForm()
  const hasAdvancedError = Object.keys(errors).some((p) => ADVANCED_PATHS.some((a) => p.startsWith(a)))
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const inflationText = formatPercent(state.inputs.inflation)

  return (
    <form className="input-form" onSubmit={(e) => e.preventDefault()} noValidate>
      <fieldset>
        <legend>Hypotéka</legend>
        <NumberField path="loan.principal" label="Výše úvěru" unit="Kč" grouped />
        <NumberField path="loan.termYears" label="Splatnost" unit="let" />
        <NumberField
          path="loan.fixationYears"
          label="Fixace"
          unit="let"
          hint="Po fixaci se sazba změní na „sazbu po fixaci“, nebo zůstane stejná."
        />
        <NumberField path="loan.classicRate" label="Sazba klasické hypotéky" unit="% p. a." scale={100} />
        <NumberField
          path="loan.offsetRate"
          label="Sazba offsetové hypotéky"
          unit="% p. a."
          scale={100}
          hint="Přirážka: o kolik je offsetová sazba vyšší než klasická."
          extra={<Surcharge />}
        />
        <NumberField
          path="loan.rateAfterFixation"
          label="Sazba klasické hypotéky po fixaci"
          unit="% p. a."
          scale={100}
          optional
          hint="Nepovinné. Prázdné pole = sazba se nezmění. Offset dostane stejnou přirážku."
        />
      </fieldset>

      <fieldset>
        <legend>Offset</legend>
        <SelectField
          path="offset.mode"
          label="Co dělá ušetřený úrok"
          options={[...MODE_B]}
          hint="Mechanika se liší podle banky. Ověřte ji u své banky."
        />
      </fieldset>

      <fieldset>
        <legend>Úspory</legend>
        <NumberField path="savings.initial" label="Počáteční úspory" unit="Kč" grouped />
        <NumberField
          path="savings.monthlyDeposit"
          label="Měsíční vklad"
          unit="Kč"
          grouped
          hint="Pravidelně spoříte navíc. Ve všech scénářích se rozpočet liší jen o tento vklad."
        />
        <NumberField
          path="savings.depositGrowth"
          label="Roční navýšení vkladu"
          unit="%"
          scale={100}
          extra={
            <button type="button" onClick={() => dispatch({ type: 'growthFromInflation' })}>
              = inflace ({inflationText})
            </button>
          }
        />
      </fieldset>

      <fieldset>
        <legend>Spořicí účty</legend>
        <Accounts />
      </fieldset>

      <fieldset>
        <legend>Mimořádné splátky (scénář D)</legend>
        <NumberField
          path="prepayment.reserve"
          label="Rezerva"
          unit="Kč"
          grouped
          hint="Částka, kterou nikdy nesplácíte. Leží na spořicích účtech."
        />
        <CheckField path="prepayment.initial" label="Snížit úvěr hned na začátku úsporami nad rezervu" />
        <CheckField path="prepayment.annual" label="Splácet průběžně (k výročí a na konci fixace)" />
        <SelectField path="prepayment.mode" label="Co dělá mimořádná splátka" options={[...MODE_D]} />
      </fieldset>

      <fieldset>
        <legend>Porovnání</legend>
        <NumberField
          path="horizonYears"
          label="Horizont"
          unit="let"
          hint="K jakému roku scénáře porovnáváme. Výchozí je konec fixace."
        />
        <NumberField
          path="inflation"
          label="Inflace"
          unit="% p. a."
          scale={100}
          hint="Slouží jen k přepočtu do dnešních korun, pořadí scénářů neovlivní."
        />
        <div className="field check">
          <label htmlFor="f-showReal">
            <input
              id="f-showReal"
              type="checkbox"
              checked={state.showReal}
              onChange={(e) => dispatch({ type: 'showReal', value: e.target.checked })}
            />{' '}
            Zobrazit v dnešních korunách
          </label>
        </div>
      </fieldset>

      <details
        className="advanced"
        open={advancedOpen || hasAdvancedError}
        onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
      >
        <summary>Pokročilé</summary>
        <fieldset>
          <legend>Offset</legend>
          <NumberField
            path="offset.cap"
            label="Strop započtených úspor"
            unit="Kč"
            grouped
            optional
            hint="Nepovinné. Nejvyšší částka, kterou banka započte proti dluhu. Prázdné = bez limitu."
          />
        </fieldset>
        <fieldset>
          <legend>Úspory</legend>
          <NumberField
            path="savings.currentAccountRate"
            label="Sazba běžného účtu"
            unit="% p. a."
            scale={100}
          />
        </fieldset>
        <fieldset>
          <legend>Mimořádné splátky</legend>
          <NumberField
            path="prepayment.freeAnnualShare"
            label="Bezplatný limit"
            unit="% původní jistiny"
            scale={100}
            hint="Podíl původní jistiny, který lze ročně splatit zdarma."
          />
          <NumberField path="prepayment.feeRate" label="Poplatek z části nad limit" unit="%" scale={100} />
        </fieldset>
        <fieldset>
          <legend>Daně</legend>
          <NumberField path="tax.savingsInterestTax" label="Daň z úroků" unit="%" scale={100} />
          <CheckField path="tax.deductMortgageInterest" label="Uplatňuji odpočet úroků z hypotéky" />
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
        </fieldset>
      </details>

      <button type="button" onClick={() => dispatch({ type: 'reset' })}>
        Obnovit výchozí hodnoty
      </button>
    </form>
  )
}
