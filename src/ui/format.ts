const czk = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 })
const NBSP = '\u00a0'

/** "1 234 567 Kč" (non-breaking spaces, no decimals). */
export function formatCzk(x: number): string {
  return `${czk.format(Math.round(x) || 0)}${NBSP}Kč`
}

/** Rate as a decimal (0.0489) to "4,89 %". */
export function formatPercent(x: number, digits = 2): string {
  const f = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${f.format(x * 100)}${NBSP}%`
}

/**
 * Parses a Czech or English number: "4,89", "4.89", "1 234 567" (also with non-breaking spaces),
 * "1 234 567 Kč", "4,89 %". Empty or nonsensical text gives null.
 */
export function parseNumber(text: string): number | null {
  const cleaned = text
    .replace(/(Kč|%)/g, '')
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace('−', '-')
    .replace(',', '.')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** Text for an input field: `value * scale`, without floating-point noise; empty for null or NaN. */
export function formatInputNumber(value: number | null, scale = 1, grouped = false): string {
  if (value === null || !Number.isFinite(value)) return ''
  const n = Number((value * scale).toPrecision(12))
  return grouped
    ? new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 10 }).format(n)
    : String(n).replace('.', ',')
}
