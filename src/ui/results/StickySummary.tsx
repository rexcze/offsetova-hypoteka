import { useEffect, useState } from 'react'
import { formatCzk } from '../format.ts'
import { SCENARIO_SHORT } from '../labels.ts'
import type { Summary } from './summary.ts'

export const VERDICT_ID = 'verdict'

/**
 * One line with the winner under the page header on narrow screens, so changes of the sliders stay visible.
 * It hides while the verdict card itself is on screen. Without IntersectionObserver it simply stays shown.
 */
export function StickySummary({ summary }: { summary: Summary }) {
  const supported = typeof IntersectionObserver !== 'undefined'
  const [verdictVisible, setVerdictVisible] = useState(supported)

  useEffect(() => {
    const target = document.getElementById(VERDICT_ID)
    if (!supported || !target) return
    const observer = new IntersectionObserver(([entry]) => setVerdictVisible(entry?.isIntersecting ?? false))
    observer.observe(target)
    return () => observer.disconnect()
  }, [supported])

  if (verdictVisible) return null
  return (
    <div
      data-testid="sticky-summary"
      className="sticky top-0 z-20 -mx-4 mb-4 truncate border-b bg-card/95 px-4 py-2 text-sm shadow-sm backdrop-blur lg:hidden"
    >
      <span className="text-muted-foreground">Nejlépe vychází: </span>
      <b>{SCENARIO_SHORT[summary.winner]}</b>
      <span className="text-muted-foreground">
        {summary.tie
          ? ', rozdíl je zanedbatelný'
          : `, o ${formatCzk(summary.lead)} víc než ${SCENARIO_SHORT[summary.second]}`}
      </span>
    </div>
  )
}
