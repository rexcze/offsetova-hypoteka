// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../App.tsx'
import { defaultInputs } from '../engine/defaults.ts'
import { decodeInputs, encodeInputs } from './share.ts'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('inputs are read from the hash on load', () => {
  const inputs = defaultInputs()
  inputs.loan.principal = 2_500_000
  inputs.horizonYears = 8
  window.history.replaceState(null, '', `/#${encodeInputs(inputs)}`)
  render(<App />)
  expect((screen.getByLabelText('Výše úvěru') as HTMLInputElement).value.replace(/\s/g, '')).toBe('2500000')
  expect((screen.getByLabelText('Horizont') as HTMLInputElement).value).toBe('8')
})

test('a damaged link shows a quiet notice and the defaults', () => {
  window.history.replaceState(null, '', '/#v1=damaged!!')
  render(<App />)
  expect(screen.getByText(/Odkaz se nepodařilo načíst/)).toBeTruthy()
  expect((screen.getByLabelText('Sazba klasické hypotéky') as HTMLInputElement).value).toBe('4,89')
})

test('changes are written to the hash after a debounce, without new history entries', () => {
  vi.useFakeTimers()
  const before = window.history.length
  render(<App />)
  fireEvent.change(screen.getByLabelText('Výše úvěru'), { target: { value: '3 000 000' } })
  act(() => {
    vi.advanceTimersByTime(400)
  })
  expect(decodeInputs(window.location.hash)?.loan.principal).toBe(3_000_000)
  expect(window.history.length).toBe(before)
})

test('the copy button copies the link and confirms', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  render(<App />)
  await act(async () => {
    fireEvent.click(screen.getByText('Zkopírovat odkaz'))
  })
  expect(writeText).toHaveBeenCalledOnce()
  expect(String(writeText.mock.calls[0]![0])).toContain('#v1=')
  expect(screen.getByText('Zkopírováno')).toBeTruthy()
  expect(screen.getByText(/Nikam ho neodesíláme/)).toBeTruthy()
})
