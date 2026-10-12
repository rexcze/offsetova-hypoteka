// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from '../../App.tsx'
import { toReal } from '../../engine/analysis.ts'
import { defaultInputs } from '../../engine/defaults.ts'
import { simulate } from '../../engine/simulate.ts'
import { formatCzk } from '../format.ts'
import { formatSigned } from './summary.ts'

beforeEach(() => {
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

/** Matches an element whose own text equals `text`, ignoring the kind of space (amounts use non-breaking spaces). */
const withText = (text: string) => (_: string, el: Element | null) =>
  el?.children.length === 0 && el.textContent?.replace(/\s/g, ' ') === text.replace(/\s/g, ' ')

const openSection = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const cards = () => within(screen.getByRole('list', { name: 'Pořadí scénářů' })).getAllByRole('listitem')

test('default inputs: the verdict names scenario D and the table is ordered D, C, B, A', () => {
  render(<App />)
  expect(screen.getByText('Za 5 let vychází nejlépe')).toBeTruthy()
  expect(
    screen.getByRole('heading', { level: 2, name: 'Klasická hypotéka a mimořádné splátky' }),
  ).toBeTruthy()

  openSection('Srovnání v tabulce')
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

test('the scenario cards are in ranking order, the winner is marked and the numbers are right', () => {
  render(<App />)
  const items = cards()
  expect(items).toHaveLength(4)
  const titles = items.map((li) => within(li).getByRole('heading', { level: 3 }).textContent)
  expect(titles).toEqual(['Mimořádné splátky', 'Spořicí účet', 'Offsetová hypotéka', 'Peníze na běžném účtu'])

  expect(items[0]!.getAttribute('data-winner')).toBe('true')
  expect(within(items[0]!).getByText('1. místo')).toBeTruthy()
  expect(items.slice(1).every((li) => li.getAttribute('data-winner') === null)).toBe(true)

  const result = simulate(defaultInputs())
  const nw = (id: 'A' | 'B' | 'C' | 'D') => result.scenarios[id].summary.netWorth
  expect(within(items[0]!).getByText(withText(formatSigned(nw('D') - nw('A'))))).toBeTruthy()
  expect(within(items[3]!).getByText(withText('0 Kč'))).toBeTruthy()
  expect(within(items[3]!).getByText('výchozí srovnání')).toBeTruthy()

  expect(within(items[0]!).getByText(/K dispozici jen 100\s000\sKč rezerva/)).toBeTruthy()
  expect(within(items[1]!).getByText('Peníze zůstávají k dispozici.')).toBeTruthy()
})

test('the real-terms switch is stated in the headings and converts the verdict once', () => {
  render(<App />)
  expect(screen.queryByRole('heading', { level: 2, name: /v dnešních korunách/ })).toBeNull()
  // There is one switch in the header of the cards and one in the chart card, bound to the same state.
  const [cardsSwitch, chartSwitch] = screen.getAllByLabelText('V dnešních korunách')
  expect(cardsSwitch).toBeTruthy()
  fireEvent.click(cardsSwitch!)
  expect(chartSwitch!.getAttribute('aria-checked')).toBe('true')
  expect(screen.getAllByRole('heading', { level: 2, name: /v dnešních korunách/ })).toHaveLength(3)

  // The lead of the winner is converted exactly once (a double conversion would show a smaller number).
  const input = defaultInputs()
  const result = simulate(input)
  const nw = (id: 'C' | 'D') => result.scenarios[id].summary.netWorth
  const months = input.horizonYears * 12
  const lead = toReal(nw('D'), months, input.inflation) - toReal(nw('C'), months, input.inflation)
  expect(screen.getByText(withText(formatCzk(lead)))).toBeTruthy()
})

test('explanation panel and disclaimer are shown', () => {
  render(<App />)
  expect(screen.getByText(/Každá koruna na offsetu vám ušetří/)).toBeTruthy()
  expect(screen.getByText(/nejde o finanční poradenství/)).toBeTruthy()
})

test('the assumptions are in a collapsed section', () => {
  render(<App />)
  expect(screen.queryByText(/Mechanika offsetu se liší podle banky/)).toBeNull()
  openSection('Předpoklady a omezení')
  expect(screen.getByText(/Mechanika offsetu se liší podle banky/)).toBeTruthy()
})

test('detailed course: tabs switch scenarios and years expand into months', () => {
  render(<App />)
  openSection('Podrobný průběh')
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

test('warnings are alerts with an icon and a text label of their level', () => {
  render(<App />)
  // Default inputs: scenario D has less money available than B, which is an information.
  const info = screen.getByText(/Při mimořádných splátkách máte na konci k dispozici/)
  expect(info.closest('[data-slot="alert"]')).toBeTruthy()
  expect(within(info.closest('[data-slot="alert"]') as HTMLElement).getByText('Informace:')).toBeTruthy()
  expect(info.closest('[data-slot="alert"]')!.querySelector('svg')).toBeTruthy()
})

test('the sticky summary bar is for narrow screens only and names the winner', () => {
  render(<App />)
  const bar = screen.getByTestId('sticky-summary')
  expect(bar.className).toContain('sticky')
  expect(bar.className).toContain('lg:hidden')
  expect(bar.textContent).toContain('Mimořádné splátky')
})

test('the sticky summary bar hides while the verdict is on screen', () => {
  let notify: IntersectionObserverCallback = () => {}
  class FakeObserver {
    constructor(callback: IntersectionObserverCallback) {
      notify = callback
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver)
  render(<App />)
  // Supported: the verdict is assumed visible until the observer says otherwise.
  expect(screen.queryByTestId('sticky-summary')).toBeNull()
  act(() => notify([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver))
  expect(screen.getByTestId('sticky-summary')).toBeTruthy()
  act(() => notify([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
  expect(screen.queryByTestId('sticky-summary')).toBeNull()
})
