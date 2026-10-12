import { useEffect, useMemo, useReducer } from 'react'
import { simulate } from './engine/simulate.ts'
import { validate } from './engine/validate.ts'
import { InputForm } from './ui/form/InputForm.tsx'
import { FormContext } from './ui/form/context.ts'
import { initialState, reducer } from './ui/form/state.ts'
import { ShareLink } from './ui/ShareLink.tsx'
import { encodeInputs, readHash } from './ui/share.ts'
import { Results } from './ui/results/Results.tsx'

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(readHash(window.location.hash)))

  const errors = useMemo(() => {
    const byPath: Record<string, string> = {}
    for (const e of validate(state.inputs)) byPath[e.path] ??= e.message
    return byPath
  }, [state.inputs])

  // Results come from the last valid inputs, so a half-typed value never blanks them.
  const result = useMemo(() => simulate(state.lastValid), [state.lastValid])
  // Keep the link in the address bar current; replaceState so the history does not fill up.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const { pathname, search } = window.location
      window.history.replaceState(null, '', `${pathname}${search}#${encodeInputs(state.lastValid)}`)
    }, 300)
    return () => window.clearTimeout(id)
  }, [state.lastValid])

  const hasErrors = Object.keys(errors).length > 0

  return (
    <main>
      <h1>Kalkulačka offsetové hypotéky</h1>
      <p className="lead">
        Offsetová hypotéka je úvěr, u kterého se úspory na přidruženém účtu odečítají od dluhu, z něhož se
        počítají úroky, a peníze přitom zůstávají vaše. Kalkulačka porovná, co se vám za několik let vyplatí
        víc: offset, klasická hypotéka se spořicími účty, nebo klasická hypotéka s mimořádnými splátkami.
        Výchozí hodnoty jsou ilustrační a všechno se počítá ve vašem prohlížeči.
      </p>
      {state.linkFailed && (
        <p className="hint" role="status">
          Odkaz se nepodařilo načíst, použili jsme výchozí hodnoty.
        </p>
      )}
      <ShareLink inputs={state.lastValid} />
      <div className="layout">
        <FormContext value={{ state, dispatch, errors }}>
          <InputForm />
        </FormContext>
        <Results inputs={state.lastValid} result={result} showReal={state.showReal} hasErrors={hasErrors} />
      </div>
    </main>
  )
}
