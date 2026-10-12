import { expect, test } from 'vitest'
import golden from '../../reference/golden.json'
import { defaultInputs } from './defaults.ts'

test('defaults equal the input of the golden case "zaklad"', () => {
  const zaklad = golden.cases.find((c) => c.name === 'zaklad')
  expect(zaklad).toBeDefined()
  expect(defaultInputs()).toEqual(zaklad?.input)
})
