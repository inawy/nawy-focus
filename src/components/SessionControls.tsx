import { formatDurationShort } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'

interface Props {
  phase: TimerPhase
  kind: SessionKind
  plannedSeconds?: number
  elapsedSeconds?: number
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onReset: () => void
  onStartBreak?: () => void
}

export function SessionControls({
  phase,
  kind,
  plannedSeconds = 0,
  elapsedSeconds = 0,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onStartBreak,
}: Props) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      {phase === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className={
            kind === 'break'
              ? 'btn-secondary-quiet w-full sm:w-auto sm:min-w-[15rem]'
              : 'btn-primary-brand w-full sm:w-auto sm:min-w-[15rem]'
          }
          title="مفتاح المسافة"
        >
          {kind === 'break' ? 'ابدأ الراحة' : 'ابدأ التركيز'}
        </button>
      )}

      {phase === 'running' && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onPause}
            className="btn-secondary-quiet min-w-[8.5rem] px-7"
          >
            إيقاف مؤقت
          </button>
          <button
            type="button"
            onClick={onStop}
            className="btn-chrome min-h-12 rounded-full px-5 text-sm"
          >
            إنهاء
          </button>
        </div>
      )}

      {phase === 'paused' && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className={
              kind === 'break'
                ? 'btn-secondary-quiet min-w-[8.5rem] px-7'
                : 'btn-primary-brand min-w-[8.5rem] px-7'
            }
          >
            متابعة
          </button>
          <button
            type="button"
            onClick={onStop}
            className="btn-chrome min-h-12 rounded-full px-5 text-sm"
          >
            إنهاء
          </button>
        </div>
      )}

      {phase === 'finished' && (
        <div className="surface-panel w-full px-5 py-5">
          <div className="text-center">
            <p className="text-[15px] font-medium text-slate-100">
              {kind === 'focus' ? 'أحسنت' : 'انتهت الراحة'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {kind === 'focus' ? 'انتهت جلسة التركيز' : 'جاهز لجلسة جديدة'}
            </p>
            {(elapsedSeconds > 0 || plannedSeconds > 0) && (
              <p className="mt-3 font-mono text-2xl font-medium tabular-nums text-brand-300">
                {formatDurationShort(
                  elapsedSeconds > 0 ? elapsedSeconds : plannedSeconds,
                )}
              </p>
            )}
          </div>

          <div className="mt-5 flex w-full flex-col items-stretch gap-2.5">
            {kind === 'focus' && onStartBreak && (
              <button
                type="button"
                onClick={onStartBreak}
                className="btn-secondary-quiet w-full"
              >
                ابدأ راحة
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className={
                kind === 'focus'
                  ? 'btn-chrome min-h-12 w-full rounded-full border-brand-500/30 text-sm font-medium text-brand-300 hover:border-brand-400/50 hover:text-brand-200'
                  : 'btn-primary-brand w-full'
              }
            >
              جلسة تركيز جديدة
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
