import type { SessionKind, TimerPhase } from '../types'
import type { StopwatchPhase } from '../hooks/useStopwatch'

interface Props {
  /** Displayed seconds (remaining for session, elapsed for stopwatch) */
  seconds: number
  phase: TimerPhase | StopwatchPhase
  kind: SessionKind | 'stopwatch'
  /** Progress 0–1 for session countdown ring; omit for stopwatch */
  progress?: number
  /** Optional primary control inside the circle (play / pause) */
  onPrimary?: () => void
  primaryLabel?: string
  /** Optional secondary circular action (e.g. sound / reset) */
  onSecondary?: () => void
  secondaryIcon?: string
  secondaryLabel?: string
}

function splitTime(totalSeconds: number): {
  hh: string | null
  mm: string
  ss: string
} {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return {
    hh: h > 0 ? String(h) : null,
    mm: String(m).padStart(2, '0'),
    ss: String(sec).padStart(2, '0'),
  }
}

function labelFor(kind: Props['kind'], phase: Props['phase']): string {
  if (kind === 'stopwatch') {
    if (phase === 'running') return 'جارٍ'
    if (phase === 'paused') return 'متوقف'
    return 'ساعة إيقاف'
  }
  if (phase === 'running') return kind === 'break' ? 'راحة' : 'تركيز'
  if (phase === 'paused') return 'متوقف مؤقتاً'
  if (phase === 'finished') return 'مكتملة'
  return kind === 'break' ? 'راحة' : 'تركيز'
}

/**
 * Circular timer face inspired by Avast Secure Browser Utilities → Focus.
 * Time digits always LTR (HH:MM:SS) even in RTL UI.
 */
export function TimerDisplay({
  seconds,
  phase,
  kind,
  progress,
  onPrimary,
  primaryLabel,
  onSecondary,
  secondaryIcon = '🔔',
  secondaryLabel = 'تنبيه',
}: Props) {
  const { hh, mm, ss } = splitTime(seconds)
  const title = labelFor(kind, phase)
  const isBreak = kind === 'break'
  const isStopwatch = kind === 'stopwatch'
  const isActive = phase === 'running' || phase === 'paused'

  const radius = 108
  const circumference = 2 * Math.PI * radius
  const clampedProgress =
    progress === undefined ? 0 : Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clampedProgress)

  const showRing = !isStopwatch && progress !== undefined && progress > 0

  const ringClass =
    phase === 'paused'
      ? 'stroke-amber-400/90'
      : isBreak
        ? 'stroke-orange-400/90'
        : 'stroke-brand-500'

  const playIcon =
    phase === 'running' ? (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    ) : (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5.5v13l11-6.5-11-6.5z" />
      </svg>
    )

  const digitClass = hh
    ? 'text-[2.1rem] leading-none sm:text-[2.55rem]'
    : 'text-[2.75rem] leading-none sm:text-[3.25rem]'
  const colonClass = hh
    ? 'pt-1 text-[1.9rem] leading-none text-slate-500 sm:text-[2.3rem]'
    : 'pt-1 text-[2.4rem] leading-none text-slate-500 sm:text-[2.9rem]'
  const unitClass = 'mt-1 text-[10px] font-medium tracking-[0.2em] text-slate-500'

  const ariaParts = [
    hh ? `${hh} ساعة` : null,
    `${mm} دقيقة`,
    `${ss} ثانية`,
  ]
    .filter(Boolean)
    .join(' و ')

  return (
    <div
      className={`timer-face relative mx-auto flex items-center justify-center ${
        isActive ? 'timer-face-active' : ''
      }`}
    >
      <div className="timer-disc absolute inset-0 rounded-full" aria-hidden />

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
          className="stroke-current opacity-[0.08]"
          strokeWidth="8"
        />
        {showRing && (
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            className={`${ringClass} transition-[stroke-dashoffset] duration-1000 linear`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div
          className={`mb-1 flex items-center gap-1.5 text-sm font-semibold ${
            isBreak
              ? 'text-orange-400'
              : isStopwatch
                ? 'text-brand-400'
                : 'text-brand-500'
          }`}
        >
          <span aria-hidden className="text-base leading-none">
            {isStopwatch ? '⏱' : isBreak ? '☕' : '◎'}
          </span>
          {title}
        </div>

        {/* Always LTR so HH:MM:SS reads left → right in RTL UI */}
        <div
          dir="ltr"
          className="timer-digits flex items-start justify-center gap-0.5 font-mono font-semibold tabular-nums tracking-tight"
          aria-live="polite"
          aria-label={ariaParts}
        >
          {hh !== null && (
            <>
              <div className="flex flex-col items-center">
                <span className={digitClass}>{hh}</span>
                <span className={unitClass}>س</span>
              </div>
              <span className={colonClass}>:</span>
            </>
          )}
          <div className="flex flex-col items-center">
            <span className={digitClass}>{mm}</span>
            <span className={unitClass}>د</span>
          </div>
          <span className={colonClass}>:</span>
          <div className="flex flex-col items-center">
            <span className={digitClass}>{ss}</span>
            <span className={unitClass}>ث</span>
          </div>
        </div>

        {onPrimary && (
          <div className="mt-4 flex items-center gap-3" dir="ltr">
            <button
              type="button"
              onClick={onPrimary}
              className="timer-play-btn flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95"
              aria-label={primaryLabel ?? (phase === 'running' ? 'إيقاف مؤقت' : 'بدء')}
            >
              {playIcon}
            </button>
            {onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                className="timer-secondary-btn flex h-10 w-10 items-center justify-center rounded-full text-sm transition active:scale-95"
                aria-label={secondaryLabel}
                title={secondaryLabel}
              >
                {secondaryIcon}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
