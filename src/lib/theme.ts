type Theme = 'light' | 'dark'

const KEY = 'theme'

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
