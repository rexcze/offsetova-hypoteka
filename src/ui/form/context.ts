import { createContext, useContext, type Dispatch } from 'react'
import type { Action, FormState } from './state.ts'

export interface FormContextValue {
  state: FormState
  dispatch: Dispatch<Action>
  /** First validation message by path. */
  errors: Record<string, string>
}

export const FormContext = createContext<FormContextValue | null>(null)

export function useForm(): FormContextValue {
  const ctx = useContext(FormContext)
  if (!ctx) throw new Error('useForm outside FormContext')
  return ctx
}
