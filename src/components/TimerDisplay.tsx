import { formatTime } from '../lib/format'
import type { TimerPhase } from '../types'

interface Props {
  remainingSeconds: number
  plannedSeconds: number
  phase: TimerPhase
}

export function TimerDisplay({ remainingSeconds, plannedSeconds, phase }: Props) {
  const progress =
    plannedSeconds > 0
      ? 1 - remainingSeconds / plannedSeconds
      : 0

  const radius = 108
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className="relative mx-auto flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72">
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
          className={
            phase === 'running'
              ? 'stroke-emerald-400 transition-[stroke-dashoffset] duration-1000 linear'
              : phase === 'finished'
                ? 'stroke-emerald-300'
                : 'stroke-slate-500'
          }
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
        <span className="mt-1 text-sm text-slate-400">
          {phase === 'running'
            ? 'جاري التركيز'
            : phase === 'paused'
              ? 'متوقف مؤقتًا'
              : phase === 'finished'
                ? 'انتهت الجلسة'
                : 'جاهز'}
        </span>
      </div>
    </div>
  )
}
