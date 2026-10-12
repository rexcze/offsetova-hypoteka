import { useEffect, useMemo, useReducer } from 'react'
import { simulate } from './engine/simulate.ts'
import { validate } from './engine/validate.ts'
import { InputForm } from './ui/form/InputForm.tsx'
import { FormContext } from './ui/form/context.ts'
import { initialState, reducer } from './ui/form/state.ts'
import { ShareButton, ShareNote, useShareLink } from './ui/ShareLink.tsx'
import { ThemeToggle } from './ui/ThemeToggle.tsx'
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

  const share = useShareLink(state.lastValid)

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              Kč
            </span>
            <h1 className="text-base font-semibold">Kalkulačka offsetové hypotéky</h1>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton share={share} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-2 max-w-3xl text-muted-foreground">
          Vyplatí se vám offsetová hypotéka, spořicí účet, nebo mimořádné splátky? Zadejte pár čísel a hned
          uvidíte rozdíl v korunách. Všechno se počítá ve vašem prohlížeči, nic se neodesílá. Výchozí hodnoty
          jsou jen ilustrační.
        </p>
        {state.linkFailed && (
          <p className="mb-2 text-sm text-muted-foreground" role="status">
            Odkaz se nepodařilo načíst, použili jsme výchozí hodnoty.
          </p>
        )}
        <ShareNote share={share} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <FormContext value={{ state, dispatch, errors }}>
            <InputForm />
          </FormContext>
          <Results inputs={state.lastValid} result={result} showReal={state.showReal} hasErrors={hasErrors} />
        </div>
      </main>
    </div>
  )
}
