// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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

test('the legend names all three scenarios and every line has its own style', () => {
  render(<App />)
  const legend = within(screen.getByRole('list', { name: 'Legenda grafu' })).getAllByRole('listitem')
  expect(legend.map((li) => li.textContent)).toEqual([
    'Offsetová hypotéka',
    'Spořicí účet',
    'Mimořádné splátky',
  ])

  // Lines in the chart differ in dash pattern (solid has none), not only in colour.
  const dash = (el: Element) => el.getAttribute('stroke-dasharray') ?? 'solid'
  const chartLines = ['B', 'C', 'D'].map((id) => dash(document.querySelector(`path[data-scenario="${id}"]`)!))
  expect(new Set(chartLines).size).toBe(3)
  // The legend samples use the same styles as the lines.
  const legendLines = ['B', 'C', 'D'].map((id) =>
    dash(document.querySelector(`line[data-legend-line="${id}"]`)!),
  )
  expect(legendLines).toEqual(chartLines)
})

test('chart and grid are in cards with their own headings', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 2, name: 'Výhoda v čase' })).toBeTruthy()
  expect(screen.getByRole('heading', { level: 2, name: 'Od kolika úspor se offset vyplatí' })).toBeTruthy()
  expect(screen.getByText(/Kolik byste získali \(nebo ztratili\) offsetem/)).toBeTruthy()
})
