import { useEffect, useState } from 'react'
import { DEFAULT_BREAK_MINUTES, DEFAULT_FOCUS_MINUTES } from '../types'
import type { SessionKind } from '../types'

interface Props {
  kind: SessionKind
  plannedSeconds: number
  onKindChange: (kind: SessionKind) => void
  onSecondsChange: (seconds: number) => void
  disabled?: boolean
}

export function DurationPicker({
  kind,
  plannedSeconds,
  onSecondsChange,
  disabled,
}: Props) {
  const presets =
    kind === 'focus' ? DEFAULT_FOCUS_MINUTES : DEFAULT_BREAK_MINUTES
  const currentMinutes = Math.round(plannedSeconds / 60)
  const isCustom = !(presets as readonly number[]).includes(currentMinutes)

  const [showCustom, setShowCustom] = useState(isCustom)
  const [customText, setCustomText] = useState(
    isCustom ? String(currentMinutes) : '',
  )

  useEffect(() => {
    if (isCustom) {
      setShowCustom(true)
      setCustomText(String(currentMinutes))
    }
  }, [isCustom, currentMinutes])

  const applyCustom = (raw: string) => {
    setCustomText(raw)
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 1) return
    const minutes = Math.max(1, Math.min(180, Math.floor(n)))
    onSecondsChange(minutes * 60)
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <div
        className="flex flex-wrap justify-center gap-2"
        role="group"
        aria-label={kind === 'focus' ? 'مدة التركيز' : 'مدة الراحة'}
      >
        {presets.map((m) => (
          <button
            key={m}
            type="button"
            disabled={disabled}
            onClick={() => {
              onSecondsChange(m * 60)
              setShowCustom(false)
              setCustomText('')
            }}
            aria-pressed={!showCustom && currentMinutes === m}
            className={`min-h-11 min-w-[3.5rem] rounded-full px-3.5 text-sm font-medium tabular-nums transition disabled:opacity-40 ${
              !showCustom && currentMinutes === m
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'surface-chip text-slate-500 hover:text-inherit'
            }`}
          >
            {m}د
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCustom(true)}
          aria-pressed={showCustom}
          className={`min-h-11 rounded-full px-3.5 text-sm font-medium transition disabled:opacity-40 ${
            showCustom
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'surface-chip text-slate-500 hover:text-inherit'
          }`}
        >
          مخصص
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center justify-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={180}
            value={customText}
            disabled={disabled}
            onChange={(e) => applyCustom(e.target.value)}
            className="surface-field w-24 rounded-xl px-3 py-2.5 text-center text-sm tabular-nums outline-none focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-40"
            aria-label="المدة بالدقائق"
          />
          <span className="text-sm text-slate-500">دقيقة</span>
        </div>
      )}
    </div>
  )
}
