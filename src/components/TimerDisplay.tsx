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
      glow: 'shadow-[0_0_36px_-14px_rgba(251,191,36,0.3)]',
      track: 'stroke-current opacity-10',
    }
  }
  if (phase === 'finished') {
    const focus = kind === 'focus'
    return {
      stroke: focus ? 'stroke-brand-400/70' : 'stroke-brand-300/50',
      label: focus ? 'text-brand-500' : 'text-brand-500/70',
      glow: 'shadow-[0_0_28px_-16px_rgba(61,123,255,0.2)]',
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
        ? 'shadow-[0_0_64px_-14px_rgba(61,123,255,0.5)]'
        : 'shadow-[0_0_40px_-14px_rgba(61,123,255,0.22)]',
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

  const sizeClass =
    phase === 'finished'
      ? 'h-56 w-56 sm:h-60 sm:w-60'
      : sessionFocus
        ? 'h-[18.5rem] w-[18.5rem] sm:h-[20.5rem] sm:w-[20.5rem]'
        : 'h-64 w-64 sm:h-72 sm:w-72'

  const timeClass =
    phase === 'finished'
      ? 'text-[2.35rem] sm:text-[2.6rem] leading-none'
      : sessionFocus
        ? 'text-[3rem] sm:text-[3.35rem] leading-none'
        : 'text-[2.75rem] sm:text-[3.15rem] leading-none'

  const motionClass =
    phase === 'running'
      ? 'timer-running'
      : phase === 'paused'
        ? 'animate-pulse-ring'
        : phase === 'finished'
          ? 'timer-finished'
          : 'timer-idle'

  return (
    <div
      className={`relative mx-auto flex items-center justify-center transition-all duration-500 ease-[var(--ease-out)] ${sizeClass} ${motionClass}`}
    >
      {phase === 'running' && (
        <>
          <div className="timer-aura timer-aura-a" aria-hidden />
          <div className="timer-aura timer-aura-b" aria-hidden />
        </>
      )}

      <div
        className={`absolute inset-[8%] rounded-full bg-gradient-to-b from-current/[0.04] to-transparent ${theme.glow}`}
        aria-hidden
      />
      <svg
        className={`-rotate-90 drop-shadow-sm ${phase === 'running' ? 'timer-ring-live' : ''}`}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <span
          className={`timer-digits font-mono font-medium tracking-tight tabular-nums transition-all duration-500 ${timeClass}`}
          aria-live="polite"
        >
          {formatTime(remainingSeconds)}
        </span>
        <span
          className={`mt-2.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${theme.label}`}
        >
          {phaseLabel}
        </span>
        {phase === 'idle' && (
          <span className="motion-fade-in mt-1.5 text-[11px] text-slate-500">
            {isBreak ? 'راحة' : 'تركيز'} · {Math.round(plannedSeconds / 60)} د
          </span>
        )}
      </div>
    </div>
  )
}
