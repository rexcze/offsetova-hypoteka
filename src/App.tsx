import { useMemo, useReducer } from 'react'
import { simulate } from './engine/simulate.ts'
import { validate } from './engine/validate.ts'
import { InputForm } from './ui/form/InputForm.tsx'
import { FormContext } from './ui/form/context.ts'
import { initialState, reducer } from './ui/form/state.ts'
import { formatCzk } from './ui/format.ts'
import { SCENARIO_LABELS } from './ui/labels.ts'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  const errors = useMemo(() => {
    const byPath: Record<string, string> = {}
    for (const e of validate(state.inputs)) byPath[e.path] ??= e.message
    return byPath
  }, [state.inputs])

  // Results come from the last valid inputs, so a half-typed value never blanks them.
  const result = useMemo(() => simulate(state.lastValid), [state.lastValid])
  const hasErrors = Object.keys(errors).length > 0
  const horizon = state.lastValid.horizonYears

  return (
    <main>
      <h1>Kalkulačka offsetové hypotéky</h1>
      <p className="lead">
        Porovná offsetovou hypotéku s klasickou hypotékou, spořicími účty a mimořádnými splátkami. Výchozí
        hodnoty jsou jen ilustrační. Všechno se počítá ve vašem prohlížeči, nic se neodesílá.
      </p>
      <div className="layout">
        <FormContext value={{ state, dispatch, errors }}>
          <InputForm />
        </FormContext>
        <section className="results" aria-live="polite">
          {hasErrors && (
            <p className="banner">
              Opravte zvýrazněná pole. Výsledky zatím platí pro poslední platné hodnoty.
            </p>
          )}
          <h2>
            Čisté jmění za {horizon} let{state.showReal ? ' (v dnešních korunách)' : ''}
          </h2>
          <ol>
            {result.ranking.map((id) => {
              const s = result.scenarios[id].summary
              return (
                <li key={id}>
                  {SCENARIO_LABELS[id]}: {formatCzk(state.showReal ? s.netWorthReal : s.netWorth)}
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </main>
  )
}
