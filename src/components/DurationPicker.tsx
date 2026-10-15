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
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex gap-2 rounded-xl bg-slate-900/60 p-1">
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
            className={`min-h-11 flex-1 rounded-lg py-2 text-sm font-medium transition ${
              kind === value
                ? 'bg-brand-500 text-white shadow-brand-500/20 shadow'
                : 'text-slate-400 hover:text-slate-200'
            } disabled:opacity-50`}
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
            className={`min-h-11 min-w-[3.25rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
              currentMinutes === m && !showCustom
                ? 'bg-slate-100 text-slate-900'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            } disabled:opacity-50`}
          >
            {m}د
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowCustom(true)}
          className={`min-h-11 min-w-[3.25rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
            showCustom || isCustom
              ? 'bg-slate-100 text-slate-900'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          } disabled:opacity-50`}
        >
          مخصص
        </button>
      </div>

      {showCustom && !disabled && (
        <div className="flex items-center justify-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <span>دقائق:</span>
            <input
              type="number"
              min={1}
              max={180}
              inputMode="numeric"
              value={customText || (isCustom ? String(currentMinutes) : '')}
              onChange={(e) => applyCustom(e.target.value)}
              className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-slate-100 outline-none focus:border-brand-500/60"
              aria-label="مدة مخصصة بالدقائق"
            />
          </label>
        </div>
      )}
    </div>
  )
}
