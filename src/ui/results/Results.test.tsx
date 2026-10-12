// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from '../../App.tsx'

afterEach(cleanup)

test('default inputs: verdict names scenario D and the table is ordered D, C, B, A', () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { level: 2, name: /vychází nejlépe: Klasická hypotéka a mimořádné splátky/ }),
  ).toBeTruthy()
  const rows = within(screen.getByRole('table', { name: 'Srovnání scénářů' }))
    .getAllByRole('row')
    .slice(1)
  expect(rows).toHaveLength(4)
  const names = rows.map((r) => (within(r).getAllByRole('rowheader')[0]!.textContent ?? '').trim())
  expect(names[0]).toMatch(/^1\. Klasická hypotéka a mimořádné splátky/)
  expect(names[1]).toMatch(/^2\. Klasická hypotéka a spořicí účty/)
  expect(names[2]).toMatch(/^3\. Offsetová hypotéka/)
  expect(names[3]).toMatch(/^4\. Klasická hypotéka, peníze na běžném účtu/)
})

test('the real-terms switch is stated in the headings', () => {
  render(<App />)
  expect(screen.queryByRole('heading', { level: 2, name: /v dnešních korunách/ })).toBeNull()
  fireEvent.click(screen.getByLabelText('Zobrazit v dnešních korunách'))
  expect(screen.getAllByRole('heading', { level: 2, name: /v dnešních korunách/ })).toHaveLength(3)
})

test('explanation panel and disclaimer are shown', () => {
  render(<App />)
  expect(screen.getByText(/Každá koruna na offsetu vám ušetří 5,19/)).toBeTruthy()
  expect(screen.getByText(/nejde o finanční poradenství/)).toBeTruthy()
})

test('detailed course: tabs switch scenarios and years expand into months', () => {
  render(<App />)
  expect(screen.getByRole('tab', { name: /B: Offsetová hypotéka/ }).getAttribute('aria-selected')).toBe(
    'true',
  )
  expect(screen.getByText('Průměrně započteno')).toBeTruthy()
  fireEvent.click(screen.getByRole('tab', { name: /A: Klasická hypotéka, peníze/ }))
  expect(screen.queryByText('Průměrně započteno')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Rok 1, zobrazit měsíce' }))
  expect(screen.getByText('měsíc 12')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Rok 1, skrýt měsíce' }))
  expect(screen.queryByText('měsíc 12')).toBeNull()
})
