export type Theme = 'light' | 'dark'

const KEY = 'theme'

/** The stored choice, or null when none is stored or storage is unavailable. */
export function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked or full: the choice just is not remembered.
  }
}

export function isDark(): boolean {
  return document.documentElement.classList.contains('dark')
}

/** Switches the theme, remembers the choice, and returns the new theme. */
export function toggleTheme(): Theme {
  const next: Theme = isDark() ? 'light' : 'dark'
  document.documentElement.classList.toggle('dark', next === 'dark')
  storeTheme(next)
  return next
}
