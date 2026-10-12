import type { ScenarioId } from '../engine/types.ts'

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  A: 'Klasická hypotéka, peníze na běžném účtu',
  B: 'Offsetová hypotéka',
  C: 'Klasická hypotéka a spořicí účty',
  D: 'Klasická hypotéka a mimořádné splátky',
}

/** Short names for the scenario cards. */
export const SCENARIO_SHORT: Record<ScenarioId, string> = {
  A: 'Peníze na běžném účtu',
  B: 'Offsetová hypotéka',
  C: 'Spořicí účet',
  D: 'Mimořádné splátky',
}

/** Tailwind classes per scenario (written out in full so Tailwind can see them). */
export const SCENARIO_DOT: Record<ScenarioId, string> = {
  A: 'bg-scenario-a',
  B: 'bg-scenario-b',
  C: 'bg-scenario-c',
  D: 'bg-scenario-d',
}

export const SCENARIO_BORDER: Record<ScenarioId, string> = {
  A: 'border-scenario-a',
  B: 'border-scenario-b',
  C: 'border-scenario-c',
  D: 'border-scenario-d',
}

export const SCENARIO_BADGE: Record<ScenarioId, string> = {
  A: 'bg-scenario-a/15',
  B: 'bg-scenario-b/15',
  C: 'bg-scenario-c/15',
  D: 'bg-scenario-d/15',
}
