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
  onKindChange,
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
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex gap-1 rounded-2xl border border-white/[0.06] bg-black/25 p-1">
        {(
          [
            ['focus', 'تركيز'],
            ['break', 'راحة'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => {
              onKindChange(value)
              setShowCustom(false)
              setCustomText('')
            }}
            className={`min-h-11 flex-1 rounded-xl py-2 text-sm font-medium transition ${
              kind === value
                ? value === 'focus'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'bg-white text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            } disabled:opacity-40`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
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
            className={`min-h-11 min-w-[3.5rem] rounded-xl px-3 py-2 text-sm font-medium transition ${
              currentMinutes === m && !showCustom
                ? 'bg-white text-slate-950 shadow-sm'
                : 'border border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
            } disabled:opacity-40`}
          >
            {m}د
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCustom(true)}
          className={`min-h-11 min-w-[3.5rem] rounded-xl px-3 py-2 text-sm font-medium transition ${
            showCustom || isCustom
              ? 'bg-white text-slate-950 shadow-sm'
              : 'border border-white/[0.06] bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
          } disabled:opacity-40`}
        >
          مخصص
        </button>
      </div>

      {showCustom && !disabled && (
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <span>دقائق</span>
            <input
              type="number"
              min={1}
              max={180}
              inputMode="numeric"
              value={customText || (isCustom ? String(currentMinutes) : '')}
              onChange={(e) => applyCustom(e.target.value)}
              className="w-[4.5rem] rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-center text-slate-100 outline-none transition focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/15"
              aria-label="مدة مخصصة بالدقائق"
            />
          </label>
        </div>
      )}
    </div>
  )
}
