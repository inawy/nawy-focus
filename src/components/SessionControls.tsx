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
    <div className="flex w-full max-w-sm flex-col items-stretch gap-2.5 px-0 sm:items-center">
      {phase === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className={
            kind === 'break'
              ? 'btn-secondary-quiet motion-pop'
              : 'btn-primary-brand motion-pop'
          }
          title="مفتاح المسافة"
        >
          {kind === 'break' ? 'ابدأ الراحة' : 'ابدأ التركيز'}
        </button>
      )}

      {phase === 'running' && (
        <div className="motion-fade-up flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={onPause}
            className="btn-secondary-quiet w-full sm:w-auto sm:min-w-[8.5rem] sm:px-7"
          >
            إيقاف مؤقت
          </button>
          <button
            type="button"
            onClick={onStop}
            className="btn-chrome min-h-12 w-full rounded-full px-5 text-sm sm:w-auto"
          >
            إنهاء
          </button>
        </div>
      )}

      {phase === 'paused' && (
        <div className="motion-fade-up flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={onResume}
            className={
              kind === 'break'
                ? 'btn-secondary-quiet w-full sm:w-auto sm:min-w-[8.5rem] sm:px-7'
                : 'btn-primary-brand w-full sm:w-auto sm:min-w-[8.5rem] sm:px-7'
            }
          >
            متابعة
          </button>
          <button
            type="button"
            onClick={onStop}
            className="btn-chrome min-h-12 w-full rounded-full px-5 text-sm sm:w-auto"
          >
            إنهاء
          </button>
        </div>
      )}

      {phase === 'finished' && (
        <div className="surface-panel motion-finish-card w-full px-4 py-5 sm:px-5">
          <div className="text-center">
            <p className="text-[15px] font-medium">
              {kind === 'focus' ? 'أحسنت' : 'انتهت الراحة'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {kind === 'focus'
                ? 'جلسة تركيز مكتملة'
                : 'يمكنك العودة للتركيز'}
            </p>
            {elapsedSeconds > 0 && (
              <p className="mt-3 font-mono text-2xl font-medium tabular-nums text-brand-500">
                {formatDurationShort(elapsedSeconds)}
                {plannedSeconds > 0 && elapsedSeconds < plannedSeconds && (
                  <span className="ms-1 text-sm font-normal text-slate-500">
                    / {formatDurationShort(plannedSeconds)}
                  </span>
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
                  ? 'btn-chrome min-h-12 w-full rounded-full text-sm'
                  : 'btn-primary-brand w-full'
              }
            >
              {kind === 'focus' ? 'جلسة جديدة' : 'العودة للتركيز'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
