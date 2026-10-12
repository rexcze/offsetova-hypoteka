import type { ReactNode } from 'react'
import { formatInputNumber } from '../format.ts'
import { useForm } from './context.ts'
import { getAt } from './state.ts'

const idOf = (path: string) => `f-${path.replaceAll('.', '-')}`

interface NumberFieldProps {
  path: string
  label: string
  unit?: string
  /** Display multiplier: 100 for rates shown as percent. */
  scale?: number
  /** Empty text means null instead of an error. */
  optional?: boolean
  /** Group thousands in the displayed value (amounts in CZK). */
  grouped?: boolean
  hint?: string
  /** Visually hidden label (the field sits in a row with its own visible label). */
  compact?: boolean
  extra?: ReactNode
}

export function NumberField({
  path,
  label,
  unit,
  scale = 1,
  optional = false,
  grouped = false,
  hint,
  compact = false,
  extra,
}: NumberFieldProps) {
  const { state, dispatch, errors } = useForm()
  const id = idOf(path)
  const value = getAt(state.inputs, path) as number | null
  const text = state.texts[path] ?? formatInputNumber(value, scale, grouped)
  const error = errors[path]
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id} className={compact ? 'sr-only' : undefined}>
        {label}
      </label>
      <div className="input-row">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => dispatch({ type: 'text', path, text: e.target.value, scale, optional })}
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
      {extra}
      {hint && (
        <small id={`${id}-hint`} className="hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

interface SelectFieldProps<T extends string | number> {
  path: string
  label: string
  options: { value: T; label: string }[]
  hint?: string
}

export function SelectField<T extends string | number>({ path, label, options, hint }: SelectFieldProps<T>) {
  const { state, dispatch } = useForm()
  const id = idOf(path)
  const value = getAt(state.inputs, path) as T
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const chosen = options.find((o) => String(o.value) === e.target.value)
          if (chosen) dispatch({ type: 'set', path, value: chosen.value })
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}

export function CheckField({ path, label, hint }: { path: string; label: string; hint?: string }) {
  const { state, dispatch } = useForm()
  const id = idOf(path)
  return (
    <div className="field check">
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={getAt(state.inputs, path) === true}
          onChange={(e) => dispatch({ type: 'set', path, value: e.target.checked })}
        />{' '}
        {label}
      </label>
      {hint && <small className="hint">{hint}</small>}
    </div>
  )
}
