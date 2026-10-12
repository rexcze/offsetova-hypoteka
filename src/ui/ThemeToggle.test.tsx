// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { readStoredTheme } from '@/lib/theme'
import { ThemeToggle } from './ThemeToggle.tsx'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('clicking adds and removes the dark class and remembers the choice', () => {
  render(<ThemeToggle />)
  const button = screen.getByRole('button', { name: 'Přepnout tmavý režim' })
  expect(button.getAttribute('aria-pressed')).toBe('false')

  fireEvent.click(button)
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(button.getAttribute('aria-pressed')).toBe('true')
  expect(readStoredTheme()).toBe('dark')

  fireEvent.click(button)
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  expect(readStoredTheme()).toBe('light')
})

test('it follows the class set before the first paint', () => {
  document.documentElement.classList.add('dark')
  render(<ThemeToggle />)
  expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
})

test('it still works when localStorage throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  render(<ThemeToggle />)
  fireEvent.click(screen.getByRole('button', { name: 'Přepnout tmavý režim' }))
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(readStoredTheme()).toBeNull()
})
