import { describe, expect, test } from 'vitest'
import golden from '../../reference/golden.json'
import { simulate } from './simulate.ts'
import type { Inputs, ScenarioId } from './types.ts'

interface GoldenCase {
  name: string
  input: Inputs
  expected: {
    budgetFirst: number
    budgetLast: number
    ranking: ScenarioId[]
    scenarios: Record<
      ScenarioId,
      {
        summary: Record<string, number | null>
        checkpoints: Record<string, Record<string, number>>
      }
    >
  }
}

const cases = golden.cases as unknown as GoldenCase[]
const tolerance = golden.tolerance

describe.each(cases)('golden: $name', ({ name, input, expected }) => {
  const result = simulate(input)

  test('budgets and ranking', () => {
    expect(result.budgets[0], `${name} budgetFirst`).toBeCloseTo(expected.budgetFirst, 2)
    expect(result.budgets.at(-1), `${name} budgetLast`).toBeCloseTo(expected.budgetLast, 2)
    expect(result.ranking).toEqual(expected.ranking)
  })

  for (const id of ['A', 'B', 'C', 'D'] as ScenarioId[]) {
    test(`scenario ${id}`, () => {
      const exp = expected.scenarios[id]
      const summary = result.scenarios[id].summary as unknown as Record<string, number | null>
      for (const [field, value] of Object.entries(exp.summary)) {
        const actual = summary[field]
        if (value === null) {
          expect(actual, `${name} ${id}.${field}`).toBeNull()
        } else {
          expect(actual, `${name} ${id}.${field}`).not.toBeNull()
          expect(Math.abs((actual as number) - value), `${name} ${id}.${field}`).toBeLessThanOrEqual(
            tolerance,
          )
        }
      }
      for (const [month, fields] of Object.entries(exp.checkpoints)) {
        const row = result.scenarios[id].rows[Number(month) - 1] as unknown as Record<string, number>
        for (const [field, value] of Object.entries(fields)) {
          expect(Math.abs(row[field]! - value), `${name} ${id} month ${month} ${field}`).toBeLessThanOrEqual(
            tolerance,
          )
        }
      }
    })
  }
})
