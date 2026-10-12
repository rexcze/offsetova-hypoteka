// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from '../../App.tsx'

afterEach(cleanup)

test('advantage chart has a summary label, a legend and a data table', () => {
  render(<App />)
  const chart = screen.getByRole('img', { name: /Výhoda proti klasické hypotéce.*po 5 letech/ })
  expect(chart).toBeTruthy()
  expect(screen.getByText('Data grafu po letech')).toBeTruthy()
})

test('break-even grid has 11 × 11 cells and highlights the current inputs', () => {
  render(<App />)
  const grid = screen.getByRole('table', { name: /Mřížka bodu zvratu/ })
  expect(grid.querySelectorAll('tbody td')).toHaveLength(121)
  const current = grid.querySelectorAll('td.current')
  expect(current).toHaveLength(1)
  // Default: savings 300 000 on a 0–2 000 000 axis (step 200 000, nearest column 2), surcharge 0,3 p. b. (row 3).
  const cell = current[0] as HTMLTableCellElement
  expect((cell.parentElement as HTMLTableRowElement).rowIndex).toBe(4)
  expect(cell.cellIndex).toBe(3)
})

test('clicking a cell shows its exact value', () => {
  render(<App />)
  const grid = screen.getByRole('table', { name: /Mřížka bodu zvratu/ })
  fireEvent.click(grid.querySelector('tbody tr:first-child td:first-of-type')!)
  expect(screen.getByText(/Počáteční úspory 0 Kč, přirážka 0,0 p\. b\./)).toBeTruthy()
})
