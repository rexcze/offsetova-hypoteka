// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import golden from '../../reference/golden.json'
import App from '../App.tsx'
import type { Inputs, ScenarioId } from '../engine/types.ts'
import { formatCzk } from './format.ts'
import { SCENARIO_LABELS } from './labels.ts'
import { encodeInputs } from './share.ts'

afterEach(cleanup)

interface Case {
  name: string
  input: Inputs
  expected: { ranking: ScenarioId[]; scenarios: Record<ScenarioId, { summary: { netWorth: number } }> }
}

const cases = (golden.cases as unknown as Case[]).filter((c) =>
  ['zaklad', 'pravidelne-sporeni', 'refixace'].includes(c.name),
)

// The same check as the manual test in README, automated: the UI must show the golden numbers.
test.each(cases)('UI shows the golden verdict and net worth for $name', ({ input, expected }) => {
  window.history.replaceState(null, '', `/#${encodeInputs(input)}`)
  render(<App />)

  const winner = expected.ranking[0]!
  expect(screen.getByRole('heading', { level: 2, name: SCENARIO_LABELS[winner] })).toBeTruthy()
  expect(screen.getByText(/vychází nejlépe/)).toBeTruthy()

  fireEvent.click(screen.getByRole('button', { name: 'Srovnání v tabulce' }))
  const rows = within(screen.getByRole('table', { name: 'Srovnání scénářů' }))
    .getAllByRole('row')
    .slice(1)
  expect(rows).toHaveLength(4)
  rows.forEach((row, i) => {
    const id = expected.ranking[i]!
    expect(within(row).getByRole('rowheader').textContent).toContain(SCENARIO_LABELS[id])
    const cell = row.querySelector('td[data-label="Čisté jmění"]')!
    expect(cell.textContent).toBe(formatCzk(expected.scenarios[id].summary.netWorth))
  })
})
