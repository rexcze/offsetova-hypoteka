/** "Nice" tick values covering [min, max], about `target` of them. */
export function niceTicks(min: number, max: number, target = 5): number[] {
  if (max <= min) max = min + 1
  const raw = (max - min) / target
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const ticks: number[] = []
  for (let v = Math.floor(min / step) * step; ; v += step) {
    ticks.push(Number(v.toPrecision(12)))
    if (v >= max - step * 1e-9) break
  }
  return ticks
}

/** Months of the x-axis ticks: whole years, at most about `maxTicks` of them. */
export function yearTicks(months: number, maxTicks = 8): number[] {
  const years = Math.floor(months / 12)
  const step = Math.max(1, Math.ceil(years / maxTicks))
  const ticks: number[] = []
  for (let y = step; y <= years; y += step) ticks.push(y * 12)
  return ticks
}
