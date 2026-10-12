import { useEffect, useRef, useState } from 'react'
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

export function ShareLink({ inputs }: { inputs: Inputs }) {
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

  return (
    <div className="share">
      <button type="button" onClick={copy}>
        Zkopírovat odkaz
      </button>
      <span role="status" className="share-status">
        {status === 'copied' && 'Zkopírováno'}
      </span>
      {status === 'manual' && (
        <label className="share-manual">
          Kopírování se nepovedlo, zkopírujte odkaz ručně:
          <input type="text" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}
      <small className="hint">Odkaz obsahuje vaše zadání. Nikam ho neodesíláme, sdílíte ho jen vy.</small>
    </div>
  )
}
