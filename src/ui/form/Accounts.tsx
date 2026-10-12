import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCzk } from '../format.ts'
import { useForm } from './context.ts'
import { NumberField } from './fields.tsx'
import { MAX_ACCOUNTS, MAX_TIERS } from './state.ts'

/** Savings accounts with their rate tiers: add, remove, edit. */
export function Accounts() {
  const { state, dispatch, errors } = useForm()
  const accounts = state.inputs.savings.accounts
  return (
    <div className="space-y-3">
      {errors['savings.accounts'] && (
        <p role="alert" className="text-xs text-destructive">
          {errors['savings.accounts']}
        </p>
      )}
      {accounts.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Bez spořicích účtů se úspory ve scénáři C úročí jen na běžném účtu.
        </p>
      )}
      {accounts.map((account, a) => {
        const tiersError = errors[`savings.accounts.${a}.tiers`]
        return (
          <div key={a} className="space-y-3 rounded-lg border border-dashed p-3">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor={`account-name-${a}`}>Název účtu {a + 1}</Label>
                <Input
                  id={`account-name-${a}`}
                  type="text"
                  value={account.name}
                  onChange={(e) =>
                    dispatch({ type: 'set', path: `savings.accounts.${a}.name`, value: e.target.value })
                  }
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'removeAccount', account: a })}
              >
                Odebrat účet {a + 1}
              </Button>
            </div>
            {tiersError && (
              <p role="alert" className="text-xs text-destructive">
                {tiersError}
              </p>
            )}
            {account.tiers.map((tier, t) => {
              const base = `savings.accounts.${a}.tiers.${t}`
              const prev = t > 0 ? account.tiers[t - 1]!.upTo : null
              return (
                <div key={t} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2">
                  {tier.upTo === null ? (
                    <span className="pt-2 text-sm">nad {prev !== null ? formatCzk(prev) : '0 Kč'}</span>
                  ) : (
                    <NumberField
                      path={`${base}.upTo`}
                      label={`Účet ${a + 1}, pásmo ${t + 1}: hranice`}
                      unit="Kč"
                      grouped
                      compact
                    />
                  )}
                  <NumberField
                    path={`${base}.rate`}
                    label={`Účet ${a + 1}, pásmo ${t + 1}: sazba`}
                    unit="% p. a."
                    scale={100}
                    compact
                  />
                  {account.tiers.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Odebrat pásmo ${t + 1} účtu ${a + 1}`}
                      onClick={() => dispatch({ type: 'removeTier', account: a, tier: t })}
                    >
                      ×
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
              )
            })}
            {account.tiers.length < MAX_TIERS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'addTier', account: a })}
              >
                Přidat pásmo k účtu {a + 1}
              </Button>
            )}
          </div>
        )
      })}
      {accounts.length < MAX_ACCOUNTS && (
        <Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: 'addAccount' })}>
          Přidat spořicí účet
        </Button>
      )}
    </div>
  )
}
