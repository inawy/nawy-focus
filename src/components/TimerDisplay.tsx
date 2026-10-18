import { formatTime } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'

interface Props {
  remainingSeconds: number
  plannedSeconds: number
  phase: TimerPhase
  kind: SessionKind
}

function phaseTheme(phase: TimerPhase, kind: SessionKind) {
  if (phase === 'paused') {
    return {
      stroke: 'stroke-amber-400/90',
      label: 'text-amber-500',
      glow: 'shadow-[0_0_28px_-14px_rgba(251,191,36,0.28)]',
      track: 'stroke-current opacity-10',
    }
  }
  if (phase === 'finished') {
    const focus = kind === 'focus'
    return {
      stroke: focus ? 'stroke-brand-400/70' : 'stroke-brand-300/50',
      label: focus ? 'text-brand-500' : 'text-brand-500/70',
      glow: 'shadow-[0_0_24px_-16px_rgba(61,123,255,0.2)]',
      track: 'stroke-current opacity-10',
    }
  }
  if (phase === 'running') {
    const focus = kind === 'focus'
    return {
      stroke: focus
        ? 'stroke-brand-500 transition-[stroke-dashoffset] duration-1000 linear'
        : 'stroke-brand-400/80 transition-[stroke-dashoffset] duration-1000 linear',
      label: focus ? 'text-brand-500' : 'text-brand-500/80',
      glow: focus
        ? 'shadow-[0_0_48px_-16px_rgba(61,123,255,0.4)]'
        : 'shadow-[0_0_32px_-16px_rgba(61,123,255,0.2)]',
      track: 'stroke-current opacity-10',
    }
  }
  return {
    stroke: kind === 'break' ? 'stroke-brand-400/35' : 'stroke-slate-500',
    label: kind === 'break' ? 'text-brand-500/50' : 'text-slate-500',
    glow: '',
    track: 'stroke-current opacity-10',
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

  const radius = 104
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  const isBreak = kind === 'break'
  const sessionFocus = phase === 'running' || phase === 'paused'
  const theme = phaseTheme(phase, kind)

  const phaseLabel =
    phase === 'running'
      ? isBreak
        ? 'راحة'
        : 'تركيز'
      : phase === 'paused'
        ? 'متوقف'
        : phase === 'finished'
          ? 'انتهت'
          : 'جاهز'

  /* Mobile-friendly sizes without overflowing decoration */
  const sizeClass =
    phase === 'finished'
      ? 'h-48 w-48 sm:h-56 sm:w-56'
      : sessionFocus
        ? 'h-[15.5rem] w-[15.5rem] sm:h-[18.5rem] sm:w-[18.5rem]'
        : 'h-[16.5rem] w-[16.5rem] sm:h-72 sm:w-72'

  const timeClass =
    phase === 'finished'
      ? 'text-[2.1rem] sm:text-[2.5rem] leading-none'
      : sessionFocus
        ? 'text-[2.65rem] sm:text-[3.2rem] leading-none'
        : 'text-[2.45rem] sm:text-[3.1rem] leading-none'

  const motionClass =
    phase === 'paused'
      ? 'animate-pulse-ring'
      : phase === 'finished'
        ? 'timer-finished'
        : phase === 'idle'
          ? 'timer-idle'
          : ''

  return (
    <div
      className={`relative mx-auto flex items-center justify-center transition-all duration-500 ease-[var(--ease-out)] ${sizeClass} ${motionClass}`}
    >
      <div
        className={`absolute inset-[8%] rounded-full bg-gradient-to-b from-current/[0.04] to-transparent ${theme.glow}`}
        aria-hidden
      />
      <svg
        className="-rotate-90 drop-shadow-sm"
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
          className={theme.track}
          strokeWidth="10"
        />
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          className={theme.stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
        <span
          className={`timer-digits font-mono font-medium tracking-tight tabular-nums transition-all duration-500 ${timeClass}`}
          aria-live="polite"
        >
          {formatTime(remainingSeconds)}
        </span>
        <span
          className={`mt-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 ${theme.label}`}
        >
          {phaseLabel}
        </span>
        {phase === 'idle' && (
          <span className="motion-fade-in mt-1 text-[11px] text-slate-500">
            {isBreak ? 'راحة' : 'تركيز'} · {Math.round(plannedSeconds / 60)} د
          </span>
        )}
      </div>
    </div>
  )
}
