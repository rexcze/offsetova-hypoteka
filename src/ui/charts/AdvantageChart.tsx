import { advantageOverA, crossovers, offsetVsBest, toReal } from '../../engine/analysis.ts'
import type { Inputs, SimulationResult } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'
import { SCENARIO_LABELS, SCENARIO_SHORT } from '../labels.ts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RealToggle } from '../results/RealToggle.tsx'
import { LineChart, type Marker, type Series } from './LineChart.tsx'

interface Props {
  inputs: Inputs
  result: SimulationResult
  showReal: boolean
  onShowRealChange: (value: boolean) => void
}

const IDS = ['B', 'C', 'D'] as const

export function AdvantageChart({ inputs, result, showReal, onShowRealChange }: Props) {
  const months = inputs.horizonYears * 12
  const advantage = advantageOverA(result)
  const convert = (values: number[]) =>
    showReal ? values.map((v, i) => toReal(v, i + 1, inputs.inflation)) : values
  const series: Series[] = IDS.map((id) => ({
    id,
    label: SCENARIO_SHORT[id],
    values: convert(advantage[id]),
  }))

  const diff = offsetVsBest(result)
  const markers: Marker[] = crossovers(diff).map((m) => ({
    month: m,
    label: diff[m - 1]! > 0 ? 'offset začne vyhrávat' : 'offset přestane vyhrávat',
  }))
  const fixationMonths = inputs.loan.fixationYears * 12
  if (months > fixationMonths) markers.push({ month: fixationMonths, label: 'konec fixace' })

  const last = (id: (typeof IDS)[number]) => series.find((s) => s.id === id)!.values[months - 1]!
  const ariaLabel =
    `Výhoda proti klasické hypotéce s penězi na běžném účtu po ${months / 12} letech: ` +
    IDS.map((id) => `${SCENARIO_SHORT[id]} ${formatCzk(last(id))}`).join(', ') +
    '.'

  const years = Array.from({ length: inputs.horizonYears }, (_, i) => (i + 1) * 12)

  return (
    <Card className="gap-0 py-5">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 px-5 pb-3">
        <h2 className="font-semibold">Výhoda v čase{showReal ? ' (v dnešních korunách)' : ''}</h2>
        <RealToggle id="f-showReal-chart" checked={showReal} onChange={onShowRealChange} />
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        <p className="text-sm text-muted-foreground">
          Výhoda proti klasické hypotéce s penězi na běžném účtu. Nula je scénář „{SCENARIO_LABELS.A}“, čára
          nad nulou znamená, že je domácnost bohatší.
        </p>
        <LineChart
          series={series}
          months={months}
          markers={markers}
          ariaLabel={ariaLabel}
          formatValue={formatCzk}
        />
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Data grafu po letech</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th scope="col" className="py-1 pr-3 text-left font-medium">
                    Rok
                  </th>
                  {IDS.map((id) => (
                    <th scope="col" key={id} className="px-2 py-1 text-right font-medium">
                      {SCENARIO_SHORT[id]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((m) => (
                  <tr key={m} className="border-t">
                    <th scope="row" className="py-1 pr-3 text-left font-normal">
                      {m / 12}
                    </th>
                    {series.map((s) => (
                      <td key={s.id} className="px-2 py-1 text-right whitespace-nowrap tabular-nums">
                        {formatCzk(s.values[m - 1]!)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
