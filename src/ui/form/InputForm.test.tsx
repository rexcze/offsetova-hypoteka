// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from '../../App.tsx'

afterEach(cleanup)

test('changing the offset rate recomputes the surcharge', () => {
  render(<App />)
  expect(screen.getByText(/Přirážka offsetu: 0,30 p\. b\./)).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Sazba offsetové hypotéky'), { target: { value: '5,59' } })
  expect(screen.getByText(/Přirážka offsetu: 0,70 p\. b\./)).toBeTruthy()
})

test('an invalid value shows an error at its field and keeps the last valid results', () => {
  render(<App />)
  const input = screen.getByLabelText('Sazba klasické hypotéky')
  fireEvent.change(input, { target: { value: '99' } })
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(document.getElementById('f-loan-classicRate-error')?.textContent).toMatch(/Sazba klasické hypotéky/)
  expect(screen.getByText(/Opravte zvýrazněná pole/)).toBeTruthy()
  expect(screen.getAllByRole('listitem').length).toBe(4)
})

test('horizon follows the fixation until it is edited, then it stays', () => {
  render(<App />)
  const horizon = screen.getByLabelText('Horizont') as HTMLInputElement
  const fixation = screen.getByLabelText('Fixace') as HTMLInputElement
  fireEvent.change(fixation, { target: { value: '7' } })
  expect(horizon.value).toBe('7')
  fireEvent.change(horizon, { target: { value: '10' } })
  fireEvent.change(fixation, { target: { value: '3' } })
  expect(horizon.value).toBe('10')
})

test('accounts and tiers can be added and removed', () => {
  render(<App />)
  fireEvent.click(screen.getByText('Přidat spořicí účet'))
  expect(screen.getByLabelText('Název účtu 2')).toBeTruthy()
  fireEvent.click(screen.getByText('Přidat pásmo k účtu 2'))
  expect(screen.getByLabelText('Účet 2, pásmo 2: sazba')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Odebrat pásmo 2 účtu 2'))
  expect(screen.queryByLabelText('Účet 2, pásmo 2: sazba')).toBeNull()
  fireEvent.click(screen.getByText('Odebrat účet 2'))
  expect(screen.queryByLabelText('Název účtu 2')).toBeNull()
})

test('reset restores the defaults', () => {
  render(<App />)
  const input = screen.getByLabelText('Výše úvěru') as HTMLInputElement
  fireEvent.change(input, { target: { value: '1 000 000' } })
  fireEvent.click(screen.getByText('Obnovit výchozí hodnoty'))
  expect(input.value.replace(/\s/g, '')).toBe('4000000')
})
