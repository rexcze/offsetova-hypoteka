import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

/** The "in today's crowns" switch; several of them can be on the page, all bound to the same state. */
export function RealToggle({
  id,
  checked,
  onChange,
}: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-muted-foreground">
        V dnešních korunách
      </Label>
    </div>
  )
}
