import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatInputNumber } from '../format.ts'
import { useForm } from './context.ts'
import { getAt } from './state.ts'

const idOf = (path: string) => `f-${path.replaceAll('.', '-')}`

function Hint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {children}
    </p>
  )
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {children}
    </p>
  )
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined

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

/** A text field for a number in Czech notation. */
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
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn(compact && 'sr-only')}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className="min-w-0 text-right tabular-nums"
          onChange={(e) => dispatch({ type: 'text', path, text: e.target.value, scale, optional })}
        />
        {unit && <span className="text-sm whitespace-nowrap text-muted-foreground">{unit}</span>}
      </div>
      {extra}
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  )
}

interface SliderInputProps {
  id: string
  label: string
  /** Current value in real units (CZK, decimal rate); null or NaN when the text is not a number. */
  value: number | null
  /** Slider range and step in displayed units (CZK, or percent for rates). */
  min: number
  max: number
  step: number
  /** Displayed units per real unit: 100 for rates. */
  scale: number
  text: string
  error?: string
  hint?: string
  unit: string
  note?: ReactNode
  formatValue: (value: number) => string
  /** Called with the typed text. */
  onText: (text: string) => void
  /** Called with the slider position in displayed units. */
  onSlider: (displayed: number) => void
}

/** Label and value on one line, a slider below, and a field for the exact number. */
export function SliderInput(props: SliderInputProps) {
  const { id, label, value, min, max, step, scale, text, error, hint, unit, note } = props
  const finite = value !== null && Number.isFinite(value)
  const position = finite ? Math.min(max, Math.max(min, value * scale)) : min
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm font-medium">
        <Label htmlFor={id}>{label}</Label>
        <output htmlFor={id} className="font-semibold tabular-nums">
          {finite ? props.formatValue(value) : '–'}
        </output>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[position]}
        thumbLabel={`${label} (posuvník)`}
        className="h-11"
        onValueChange={([v]) => props.onSlider(v ?? min)}
      />
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className="w-36 text-right tabular-nums"
          onChange={(e) => props.onText(e.target.value)}
        />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {note}
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  )
}

interface SliderFieldProps {
  path: string
  label: string
  min: number
  max: number
  step: number
  scale?: number
  grouped?: boolean
  unit: string
  hint?: string
  formatValue: (value: number) => string
}

/** A slider and a text field bound to one number in the form state. */
export function SliderField({ path, scale = 1, grouped = false, ...rest }: SliderFieldProps) {
  const { state, dispatch, errors } = useForm()
  const value = getAt(state.inputs, path) as number
  const onText = (text: string) => dispatch({ type: 'text', path, text, scale, optional: false })
  return (
    <SliderInput
      {...rest}
      id={idOf(path)}
      value={value}
      scale={scale}
      text={state.texts[path] ?? formatInputNumber(value, scale, grouped)}
      error={errors[path]}
      onText={onText}
      onSlider={(displayed) => onText(formatInputNumber(displayed / scale, scale, grouped))}
    />
  )
}

interface SelectFieldProps<T extends string | number> {
  path: string
  label: string
  options: { value: T; label: string }[]
  hint?: string
  /** Dispatch the choice as typed text (so the number rules of the form apply), not as a raw value. */
  asText?: boolean
}

export function SelectField<T extends string | number>({
  path,
  label,
  options,
  hint,
  asText = false,
}: SelectFieldProps<T>) {
  const { state, dispatch, errors } = useForm()
  const id = idOf(path)
  const value = getAt(state.inputs, path) as T
  const error = errors[path]
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={String(value)}
        onValueChange={(chosen) => {
          const option = options.find((o) => String(o.value) === chosen)
          if (!option) return
          if (asText) dispatch({ type: 'text', path, text: chosen, scale: 1, optional: false })
          else dispatch({ type: 'set', path, value: option.value })
        }}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  )
}

interface CheckFieldProps {
  id: string
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
}

export function CheckField({ id, label, checked, onChange, hint }: CheckFieldProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        className="mt-0.5"
        aria-describedby={hint ? `${id}-hint` : undefined}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <div className="space-y-0.5 text-sm">
        <Label htmlFor={id} className="leading-snug">
          {label}
        </Label>
        {hint && <Hint id={`${id}-hint`}>{hint}</Hint>}
      </div>
    </div>
  )
}

/** A check box bound to a boolean in the inputs. */
export function PathCheckField({ path, label, hint }: { path: string; label: ReactNode; hint?: string }) {
  const { state, dispatch } = useForm()
  return (
    <CheckField
      id={idOf(path)}
      label={label}
      hint={hint}
      checked={getAt(state.inputs, path) === true}
      onChange={(value) => dispatch({ type: 'set', path, value })}
    />
  )
}
