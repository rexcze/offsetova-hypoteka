import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { isDark, toggleTheme } from '@/lib/theme'

/** The initial theme is set before the first paint by the script in index.html; this only follows it. */
export function ThemeToggle() {
  const [dark, setDark] = useState(isDark)
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Přepnout tmavý režim"
      aria-pressed={dark}
      onClick={() => setDark(toggleTheme() === 'dark')}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
