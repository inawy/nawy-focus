import type { SessionKind, TimerPhase } from '../types'
import type { StopwatchPhase } from '../hooks/useStopwatch'

export type TimerAccent = 'brand' | 'orange' | 'green' | 'purple' | 'pink' | 'teal'

interface Props {
  seconds?: number
  milliseconds?: number
  phase: TimerPhase | StopwatchPhase
  kind: SessionKind | 'stopwatch'
  progress?: number
  accent?: TimerAccent
  activityLabel?: string
  activityIcon?: string
  onPrimary?: () => void
  primaryLabel?: string
  onSecondary?: () => void
  secondaryIcon?: string
  secondaryLabel?: string
  onReset?: () => void
  showMs?: boolean
}

function splitFromMs(totalMs: number): {
  hh: string | null
  mm: string
  ss: string
  ms: string
} {
  const t = Math.max(0, Math.floor(totalMs))
  const h = Math.floor(t / 3_600_000)
  const m = Math.floor((t % 3_600_000) / 60_000)
  const s = Math.floor((t % 60_000) / 1000)
  const ms = t % 1000
  return {
    hh: h > 0 ? String(h) : null,
    mm: String(m).padStart(2, '0'),
    ss: String(s).padStart(2, '0'),
    ms: String(ms).padStart(3, '0'),
  }
}

function splitFromSeconds(totalSeconds: number) {
  return splitFromMs(Math.max(0, Math.floor(totalSeconds)) * 1000)
}

const ACCENT_TEXT: Record<TimerAccent, string> = {
  brand: 'text-brand-500',
  orange: 'text-orange-400',
  green: 'text-emerald-400',
  purple: 'text-violet-400',
  pink: 'text-pink-400',
  teal: 'text-teal-400',
}

const ACCENT_RING: Record<TimerAccent, string> = {
  brand: 'stroke-brand-500',
  orange: 'stroke-orange-400',
  green: 'stroke-emerald-400',
  purple: 'stroke-violet-400',
  pink: 'stroke-pink-400',
  teal: 'stroke-teal-400',
}

const ACCENT_BTN: Record<TimerAccent, string> = {
  brand: 'bg-brand-500',
  orange: 'bg-orange-500',
  green: 'bg-emerald-500',
  purple: 'bg-violet-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
}

/** Calm circular session face (Avast-style): solid disc + progress arc — no clock ticks */
export function TimerDisplay({
  seconds = 0,
  milliseconds,
  phase,
  kind,
  progress,
  accent = 'brand',
  activityLabel,
  activityIcon,
  onPrimary,
  primaryLabel,
  onSecondary,
  secondaryIcon = '🔔',
  secondaryLabel = 'تنبيه',
  onReset,
  showMs = false,
}: Props) {
  const totalMs =
    milliseconds !== undefined ? milliseconds : Math.max(0, seconds) * 1000
  const { hh, mm, ss, ms } = showMs
    ? splitFromMs(totalMs)
    : splitFromSeconds(totalMs / 1000)

  const isBreak = kind === 'break'
  const isStopwatch = kind === 'stopwatch'
  const isActive = phase === 'running' || phase === 'paused'
  const resolvedAccent: TimerAccent = isStopwatch
    ? 'brand'
    : isBreak && accent === 'brand'
      ? 'orange'
      : accent

  const title =
    activityLabel ??
    (isStopwatch
      ? phase === 'running'
        ? 'جارٍ'
        : phase === 'paused'
          ? 'متوقف'
          : 'ساعة إيقاف'
      : phase === 'running'
        ? isBreak
          ? 'راحة'
          : 'تركيز'
        : phase === 'paused'
          ? 'متوقف مؤقتاً'
          : phase === 'finished'
            ? 'مكتملة'
            : isBreak
              ? 'راحة'
              : 'تركيز')

  const icon =
    activityIcon ?? (isStopwatch ? '⏱' : isBreak ? '☕' : '◎')

  const radius = 108
  const circumference = 2 * Math.PI * radius
  const clamped =
    progress === undefined ? 0 : Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)
  const showRing =
    !isStopwatch && progress !== undefined && (progress > 0 || isActive)

  const playIcon =
    phase === 'running' ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="6" y="5" width="4" height="14" rx="1.2" />
        <rect x="14" y="5" width="4" height="14" rx="1.2" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5.5v13l11-6.5-11-6.5z" />
      </svg>
    )

  const digitClass = showMs
    ? hh
      ? 'text-[1.45rem] leading-none sm:text-[1.8rem]'
      : 'text-[2rem] leading-none sm:text-[2.35rem]'
    : hh
      ? 'text-[2.1rem] leading-none sm:text-[2.5rem]'
      : 'text-[2.75rem] leading-none sm:text-[3.2rem]'
  const msClass = 'text-[1.35rem] leading-none text-slate-400 sm:text-[1.55rem]'
  const colonClass = showMs
    ? 'pt-0.5 text-[1.7rem] leading-none text-slate-500'
    : 'pt-1 text-[2.3rem] leading-none text-slate-500 sm:text-[2.8rem]'
  const unitClass =
    'mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500'

  const aria = showMs
    ? [hh ? `${hh} ساعة` : null, `${mm} دقيقة`, `${ss} ثانية`, `${ms} ملي ثانية`]
        .filter(Boolean)
        .join(' و ')
    : [hh ? `${hh} ساعة` : null, `${mm} دقيقة`, `${ss} ثانية`]
        .filter(Boolean)
        .join(' و ')

  return (
    <div
      className={`timer-face relative mx-auto flex items-center justify-center ${
        isActive ? 'timer-face-active' : ''
      } ${isStopwatch ? 'timer-face-stopwatch' : ''}`}
    >
      <div className="timer-disc absolute inset-0 rounded-full" aria-hidden />

      <svg
        className="absolute inset-0"
        width="100%"
        height="100%"
        viewBox="0 0 240 240"
        aria-hidden
      >
        {isStopwatch ? (
          <>
            <circle cx="120" cy="120" r="112" fill="none" stroke="currentColor" strokeOpacity=".045" strokeWidth="1" />
            {Array.from({ length: 60 }, (_, index) => {
              const angle = (index * 6 - 90) * (Math.PI / 180)
              const major = index % 15 === 0
              const medium = index % 5 === 0
              const inner = major ? 96 : medium ? 100 : 103
              const outer = major ? 105 : medium ? 104 : 105
              const x1 = 120 + Math.cos(angle) * inner
              const y1 = 120 + Math.sin(angle) * inner
              const x2 = 120 + Math.cos(angle) * outer
              const y2 = 120 + Math.sin(angle) * outer
              return (
                <line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={index < Math.floor((totalMs % 60000) / 1000) ? 'var(--color-brand-500)' : 'currentColor'}
                  strokeOpacity={major ? '.9' : medium ? '.48' : '.25'}
                  strokeWidth={major ? '2.2' : medium ? '1.5' : '1'}
                  strokeLinecap="round"
                />
              )
            })}
            <circle
              cx="120"
              cy="120"
              r="109"
              fill="none"
              stroke="var(--color-brand-500)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 109 * ((totalMs % 60000) / 60000)} ${2 * Math.PI * 109 * (1 - (totalMs % 60000) / 60000)}`}
              transform="rotate(-90 120 120)"
              opacity={phase === 'idle' ? '.5' : '1'}
            />
          </>
        ) : (
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            className="stroke-current opacity-[0.08]"
            strokeWidth="8"
          />
        )}

        {showRing && (
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            className={`${
              phase === 'paused'
                ? 'stroke-amber-400/90'
                : ACCENT_RING[resolvedAccent]
            } transition-[stroke-dashoffset] duration-300 linear`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 120 120)"
          />
        )}

        {isStopwatch && phase === 'running' && (
          <circle cx="120" cy="11" r="3.5" className="fill-brand-500" />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-3">
        <div
          className={`mb-0.5 flex items-center gap-1.5 text-sm font-semibold ${ACCENT_TEXT[resolvedAccent]}`}
        >
          <span aria-hidden className="text-base leading-none">
            {icon}
          </span>
          {title}
        </div>

        <div
          dir="ltr"
          className="timer-digits flex items-start justify-center gap-0.5 font-mono font-semibold tabular-nums tracking-tight"
          role="timer"
          aria-label={aria}
        >
          {hh !== null && (
            <>
              <div className="flex flex-col items-center">
                <span className={digitClass}>{hh}</span>
                <span className={unitClass}>HH</span>
              </div>
              <span className={colonClass}>:</span>
            </>
          )}
          <div className="flex flex-col items-center">
            <span className={digitClass}>{mm}</span>
            <span className={unitClass}>MM</span>
          </div>
          <span className={colonClass}>:</span>
          <div className="flex flex-col items-center">
            <span className={digitClass}>{ss}</span>
            <span className={unitClass}>SS</span>
          </div>
          {showMs && (
            <>
              <span className={`${colonClass} text-slate-600`}>.</span>
              <div className="flex flex-col items-center">
                <span className={`${msClass} font-semibold tabular-nums`}>{ms}</span>
                <span className={unitClass}>MS</span>
              </div>
            </>
          )}
        </div>

        {(onPrimary || onReset || onSecondary) && (
          <div className="mt-3.5 flex items-center gap-3" dir="ltr">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="timer-secondary-btn flex h-10 w-10 items-center justify-center rounded-full text-base transition active:scale-95"
                aria-label="إعادة التعيين"
                title="إعادة التعيين"
              >
                ↺
              </button>
            )}
            {onPrimary && (
              <button
                type="button"
                onClick={onPrimary}
                className={`timer-play-btn flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 ${ACCENT_BTN[resolvedAccent]}`}
                aria-label={
                  primaryLabel ?? (phase === 'running' ? 'إيقاف مؤقت' : 'بدء')
                }
              >
                {playIcon}
              </button>
            )}
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
