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
            onClick={() => onKindChange(value)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              kind === value
                ? 'bg-emerald-600 text-white shadow'
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
            onClick={() => onSecondsChange(m * 60)}
            className={`min-w-[3.25rem] rounded-lg px-3 py-2 text-sm font-medium transition ${
              currentMinutes === m
                ? 'bg-slate-100 text-slate-900'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            } disabled:opacity-50`}
          >
            {m}د
          </button>
        ))}
      </div>
    </div>
  )
}
