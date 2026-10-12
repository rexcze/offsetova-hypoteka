// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test } from 'vitest'
import App from '../../App.tsx'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(cleanup)

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement
const type = (label: string, value: string) => fireEvent.change(field(label), { target: { value } })
const digits = (text: string) => text.replace(/\s/g, '')
const tableRows = () =>
  within(screen.getByRole('table', { name: 'Srovnání scénářů' })).getAllByRole('row').length

/** Opens a Radix select with the keyboard and picks an option. */
function choose(label: string, option: string) {
  fireEvent.keyDown(screen.getByLabelText(label), { key: 'Enter' })
  fireEvent.keyDown(screen.getByRole('option', { name: option }), { key: 'Enter' })
}

test('the offset rate follows the mortgage rate until "another rate" is ticked', () => {
  render(<App />)
  const differs = screen.getByLabelText(/Banka nabízí u offsetu jinou sazbu/)
  fireEvent.click(differs)
  expect(screen.queryByLabelText('Úroková sazba offsetové hypotéky')).toBeNull()

  type('Úroková sazba hypotéky', '5,5')
  fireEvent.click(differs)
  expect(field('Úroková sazba offsetové hypotéky').value).toBe('5,5')
  expect(screen.getByText('+0,00 p. b.')).toBeTruthy()

  // Ticked: changing the mortgage rate no longer touches the offset rate.
  type('Úroková sazba hypotéky', '6')
  expect(field('Úroková sazba offsetové hypotéky').value).toBe('5,5')
  expect(screen.getByText('−0,50 p. b.')).toBeTruthy()
})

test('typing the offset rate shows the surcharge', () => {
  render(<App />)
  type('Úroková sazba offsetové hypotéky', '5,19')
  expect(screen.getByText('+0,30 p. b.')).toBeTruthy()
  type('Úroková sazba offsetové hypotéky', '4,79')
  expect(screen.getByText('−0,10 p. b.')).toBeTruthy()
})

test('the slider and the field hold the same value, also outside the slider range', () => {
  render(<App />)
  const slider = screen.getByRole('slider', { name: 'Výše úvěru (posuvník)' })
  expect(slider.getAttribute('aria-valuenow')).toBe('4000000')

  type('Výše úvěru', '5 000 000')
  expect(slider.getAttribute('aria-valuenow')).toBe('5000000')

  fireEvent.keyDown(slider, { key: 'ArrowRight' })
  expect(digits(field('Výše úvěru').value)).toBe('5100000')

  type('Výše úvěru', '20 000 000')
  expect(slider.getAttribute('aria-valuenow')).toBe('12000000')
  expect(screen.queryByText(/Opravte zvýrazněná pole/)).toBeNull()
})

test('an invalid text shows an error at its field and keeps the last valid results', () => {
  render(<App />)
  const input = field('Úroková sazba hypotéky')
  fireEvent.change(input, { target: { value: '99' } })
  expect(input.getAttribute('aria-invalid')).toBe('true')
  const errorId = input
    .getAttribute('aria-describedby')!
    .split(' ')
    .find((id) => id.endsWith('-error'))!
  expect(document.getElementById(errorId)?.textContent).toMatch(/Sazba klasické hypotéky/)
  expect(screen.getByText(/Opravte zvýrazněná pole/)).toBeTruthy()
  expect(tableRows()).toBe(5)

  type('Úroková sazba hypotéky', 'abc')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(tableRows()).toBe(5)
})

test('an advanced section opens by itself when a field in it has an error', () => {
  render(<App />)
  const trigger = screen.getByRole('button', { name: 'Upřesnit spoření' })
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  // 1 % in the first tier is below the 2 % of the second tier: the rates may not rise.
  type('Úrok vašeho spořicího účtu', '1')
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  // The error is shown at the simple field and at the tier it belongs to.
  expect(screen.getAllByText(/Sazba nesmí být vyšší než u předchozího pásma/).length).toBeGreaterThan(0)
  const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test('the simple savings rate shows a note while there are more tiers', () => {
  render(<App />)
  expect(screen.getByText(/Z části úspor nad hranicí platí nižší sazba/)).toBeTruthy()
})

test('the horizon follows the fixation until it is edited, then it stays', () => {
  render(<App />)
  const horizon = screen.getByLabelText('Porovnat za')
  choose('Fixace', '7 let')
  expect(horizon.textContent).toBe('7 let')
  choose('Porovnat za', '10 let')
  choose('Fixace', '3 roky')
  expect(horizon.textContent).toBe('10 let')
})

test('accounts and tiers can be added and removed in the savings section', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Upřesnit spoření' }))
  fireEvent.click(screen.getByText('Přidat spořicí účet'))
  expect(screen.getByLabelText('Název účtu 2')).toBeTruthy()
  fireEvent.click(screen.getByText('Přidat pásmo k účtu 2'))
  expect(screen.getByLabelText('Účet 2, pásmo 2: sazba')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Odebrat pásmo 2 účtu 2'))
  expect(screen.queryByLabelText('Účet 2, pásmo 2: sazba')).toBeNull()
  fireEvent.click(screen.getByText('Odebrat účet 2'))
  expect(screen.queryByLabelText('Název účtu 2')).toBeNull()
})

test('"Vyzkoušet na příkladu" sets the default values', () => {
  render(<App />)
  type('Výše úvěru', '1 000 000')
  type('Úroková sazba hypotéky', '3')
  fireEvent.click(screen.getByText('Vyzkoušet na příkladu'))
  expect(digits(field('Výše úvěru').value)).toBe('4000000')
  expect(field('Úroková sazba hypotéky').value).toBe('4,89')
})

test('reset restores the defaults', () => {
  render(<App />)
  type('Výše úvěru', '1 000 000')
  fireEvent.click(screen.getByText('Obnovit výchozí hodnoty'))
  expect(digits(field('Výše úvěru').value)).toBe('4000000')
})
