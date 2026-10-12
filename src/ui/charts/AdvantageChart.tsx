import { advantageOverA, crossovers, offsetVsBest, toReal } from '../../engine/analysis.ts'
import type { Inputs, SimulationResult } from '../../engine/types.ts'
import { formatCzk } from '../format.ts'
import { SCENARIO_LABELS } from '../labels.ts'
import { LineChart, type Marker, type Series } from './LineChart.tsx'

interface Props {
  inputs: Inputs
  result: SimulationResult
  showReal: boolean
}

const IDS = ['B', 'C', 'D'] as const

export function AdvantageChart({ inputs, result, showReal }: Props) {
  const months = inputs.horizonYears * 12
  const advantage = advantageOverA(result)
  const convert = (values: number[]) =>
    showReal ? values.map((v, i) => toReal(v, i + 1, inputs.inflation)) : values
  const series: Series[] = IDS.map((id) => ({
    id,
    label: SCENARIO_LABELS[id],
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
    IDS.map((id) => `${SCENARIO_LABELS[id]} ${formatCzk(last(id))}`).join(', ') +
    '.'

  const years = Array.from({ length: inputs.horizonYears }, (_, i) => (i + 1) * 12)

  return (
    <section className="chart-section">
      <h2>
        Výhoda proti klasické hypotéce s penězi na běžném účtu{showReal ? ' (v dnešních korunách)' : ''}
      </h2>
      <p className="hint">
        Nula je scénář „{SCENARIO_LABELS.A}“. Čára nad nulou znamená, že je domácnost bohatší než s penězi na
        běžném účtu.
      </p>
      <LineChart
        series={series}
        months={months}
        markers={markers}
        ariaLabel={ariaLabel}
        formatValue={formatCzk}
      />
      <details>
        <summary>Data grafu po letech</summary>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Rok</th>
                {IDS.map((id) => (
                  <th scope="col" key={id}>
                    {SCENARIO_LABELS[id]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {years.map((m) => (
                <tr key={m}>
                  <th scope="row">{m / 12}</th>
                  {series.map((s) => (
                    <td key={s.id}>{formatCzk(s.values[m - 1]!)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}
