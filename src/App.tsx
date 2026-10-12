import { useMemo, useReducer } from 'react'
import { simulate } from './engine/simulate.ts'
import { validate } from './engine/validate.ts'
import { InputForm } from './ui/form/InputForm.tsx'
import { FormContext } from './ui/form/context.ts'
import { initialState, reducer } from './ui/form/state.ts'
import { Results } from './ui/results/Results.tsx'

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
        <Results inputs={state.lastValid} result={result} showReal={state.showReal} hasErrors={hasErrors} />
      </div>
    </main>
  )
}
