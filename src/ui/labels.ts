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

export const SCENARIO_STROKE: Record<ScenarioId, string> = {
  A: 'stroke-scenario-a',
  B: 'stroke-scenario-b',
  C: 'stroke-scenario-c',
  D: 'stroke-scenario-d',
}

export const SCENARIO_FILL: Record<ScenarioId, string> = {
  A: 'fill-scenario-a',
  B: 'fill-scenario-b',
  C: 'fill-scenario-c',
  D: 'fill-scenario-d',
}

/**
 * Line style per scenario, so lines differ by more than colour: solid, dashed, dotted.
 * Dots use a near-zero dash with round caps (a short dash plus a round cap would run together).
 */
export const SCENARIO_DASH: Record<ScenarioId, string | undefined> = {
  A: '1 6',
  B: undefined,
  C: '9 6',
  D: '0.1 6',
}
