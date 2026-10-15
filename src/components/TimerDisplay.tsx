import { formatTime } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'

interface Props {
  remainingSeconds: number
  plannedSeconds: number
  phase: TimerPhase
  kind: SessionKind
}

/** تركيز → أزرق ناوي · راحة → رمادي هادئ · إيقاف → كهرماني */
function phaseTheme(phase: TimerPhase, kind: SessionKind) {
  if (phase === 'paused') {
    return {
      stroke: 'stroke-amber-400/80',
      label: 'text-amber-300/90',
      glow: 'shadow-[0_0_28px_-10px_rgba(251,191,36,0.28)]',
    }
  }
  if (phase === 'running' || phase === 'finished') {
    const focus = kind === 'focus'
    return {
      stroke: focus
        ? phase === 'running'
          ? 'stroke-brand-500 transition-[stroke-dashoffset] duration-1000 linear'
          : 'stroke-brand-400'
        : phase === 'running'
          ? 'stroke-slate-400 transition-[stroke-dashoffset] duration-1000 linear'
          : 'stroke-slate-500',
      label: focus ? 'text-brand-300' : 'text-slate-400',
      glow:
        phase === 'running'
          ? focus
            ? 'shadow-[0_0_48px_-10px_rgba(61,123,255,0.4)]'
            : 'shadow-[0_0_28px_-10px_rgba(148,163,184,0.2)]'
          : '',
    }
  }
  return {
    stroke: 'stroke-slate-600',
    label: 'text-slate-500',
    glow: '',
  }
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
  const sessionFocus = phase === 'running' || phase === 'paused'
  const theme = phaseTheme(phase, kind)

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

  return (
    <div
      className={`relative mx-auto flex items-center justify-center rounded-full transition-all duration-300 ease-[var(--ease-out)] ${
        sessionFocus ? 'h-72 w-72 sm:h-80 sm:w-80' : 'h-64 w-64 sm:h-72 sm:w-72'
      } ${theme.glow}`}
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
          className={theme.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono font-semibold tracking-tight text-slate-50 tabular-nums transition-all duration-300 ${
            sessionFocus ? 'text-6xl sm:text-7xl' : 'text-5xl sm:text-6xl'
          }`}
          aria-live="polite"
        >
          {formatTime(remainingSeconds)}
        </span>
        <span className={`mt-1 text-sm ${theme.label}`}>{phaseLabel}</span>
        {phase === 'idle' && (
          <span className="mt-0.5 text-[11px] text-slate-600">
            {isBreak ? 'راحة' : 'تركيز'} · {Math.round(plannedSeconds / 60)}د
          </span>
        )}
      </div>
    </div>
  )
}
