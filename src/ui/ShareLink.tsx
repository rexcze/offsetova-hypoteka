import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Inputs } from '../engine/types.ts'
import { shareUrl } from './share.ts'

type Status = 'idle' | 'copied' | 'manual'

/** Copies text with the Clipboard API, falling back to a hidden textarea; false when both fail. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}

export interface ShareState {
  url: string
  status: Status
  copy: () => void
}

export function useShareLink(inputs: Inputs): ShareState {
  const [status, setStatus] = useState<Status>('idle')
  const timer = useRef<number | undefined>(undefined)
  const url = shareUrl(inputs, window.location)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    const ok = await copyText(url)
    setStatus(ok ? 'copied' : 'manual')
    window.clearTimeout(timer.current)
    if (ok) timer.current = window.setTimeout(() => setStatus('idle'), 2500)
  }

  return { url, status, copy }
}

/** The copy button for the page header, with its confirmation. */
export function ShareButton({ share }: { share: ShareState }) {
  return (
    <>
      <span role="status" className="text-sm text-muted-foreground">
        {share.status === 'copied' && 'Zkopírováno'}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={share.copy}>
        Zkopírovat odkaz
      </Button>
    </>
  )
}

/** Privacy note and the manual fallback when copying fails. */
export function ShareNote({ share }: { share: ShareState }) {
  return (
    <div className="mb-6 space-y-2">
      {share.status === 'manual' && (
        <label className="block text-sm">
          Kopírování se nepovedlo, zkopírujte odkaz ručně:
          <Input
            type="text"
            readOnly
            value={share.url}
            className="mt-1"
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">
        Odkaz obsahuje vaše zadání. Nikam ho neodesíláme, sdílíte ho jen vy.
      </p>
    </div>
  )
}
