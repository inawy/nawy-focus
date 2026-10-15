import { formatTime } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'

interface Props {
  remainingSeconds: number
  plannedSeconds: number
  phase: TimerPhase
  kind: SessionKind
}

export function TimerDisplay({
  remainingSeconds,
  plannedSeconds,
  phase,
  kind,
}: Props) {
  const progress =
    plannedSeconds > 0 ? 1 - remainingSeconds / plannedSeconds : 0

  const radius = 108
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const isBreak = kind === 'break'
  const activeStroke =
    phase === 'running'
      ? isBreak
        ? 'stroke-sky-400 transition-[stroke-dashoffset] duration-1000 linear'
        : 'stroke-emerald-400 transition-[stroke-dashoffset] duration-1000 linear'
      : phase === 'paused'
        ? 'stroke-amber-400/80'
        : phase === 'finished'
          ? isBreak
            ? 'stroke-sky-300'
            : 'stroke-emerald-300'
          : 'stroke-slate-500'

  const phaseLabel =
    phase === 'running'
      ? isBreak
        ? 'جاري الراحة'
        : 'جاري التركيز'
      : phase === 'paused'
        ? 'متوقف مؤقتًا'
        : phase === 'finished'
          ? 'انتهت الجلسة'
          : 'جاهز'

  const ringGlow =
    phase === 'running'
      ? isBreak
        ? 'shadow-[0_0_40px_-8px_rgba(56,189,248,0.35)]'
        : 'shadow-[0_0_40px_-8px_rgba(52,211,153,0.35)]'
      : phase === 'paused'
        ? 'shadow-[0_0_24px_-8px_rgba(251,191,36,0.25)]'
        : ''

  return (
    <div
      className={`relative mx-auto flex h-64 w-64 items-center justify-center rounded-full sm:h-72 sm:w-72 ${ringGlow}`}
    >
      <svg
        className="-rotate-90"
        width="100%"
        height="100%"
        viewBox="0 0 240 240"
        aria-hidden
      >
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          className="stroke-slate-800"
          strokeWidth="8"
        />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          className={activeStroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-5xl font-semibold tracking-tight text-slate-50 tabular-nums sm:text-6xl"
          aria-live="polite"
        >
          {formatTime(remainingSeconds)}
        </span>
        <span
          className={`mt-1 text-sm ${
            phase === 'running'
              ? isBreak
                ? 'text-sky-300/90'
                : 'text-emerald-300/90'
              : phase === 'paused'
                ? 'text-amber-300/90'
                : 'text-slate-400'
          }`}
        >
          {phaseLabel}
        </span>
        {phase === 'idle' && (
          <span className="mt-0.5 text-[11px] text-slate-600">
            {isBreak ? 'راحة' : 'تركيز'} · {Math.round(plannedSeconds / 60)}د
          </span>
        )}
      </div>
    </div>
  )
}
