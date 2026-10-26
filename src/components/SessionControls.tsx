import { formatDurationShort } from '../lib/format'
import type { SessionKind, TimerPhase } from '../types'
import { Icon } from './Icon'

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
    <div className="session-controls flex w-full max-w-md min-w-0 flex-col items-stretch gap-2.5 px-0 sm:items-center">
      {phase === 'idle' && (
        <button
          type="button"
          onClick={onStart}
          className={
            kind === 'break'
              ? 'btn-secondary-quiet motion-pop'
              : 'btn-primary-brand motion-pop'
          }
          title="اختصار: مفتاح المسافة"
        >
          <Icon name="play" size={18} className="me-2 inline-block align-[-4px]" />
          {kind === 'break' ? 'بدء الراحة' : 'بدء التركيز'}
        </button>
      )}

      {phase === 'running' && (
        <div className="motion-fade-up flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={onPause}
            className="btn-secondary-quiet w-full sm:w-auto sm:min-w-[8.5rem] sm:px-7"
          >
            <Icon name="pause" size={18} className="me-2 inline-block align-[-4px]" />
            إيقاف مؤقت
          </button>
          <button
            type="button"
            onClick={onStop}
            className="btn-chrome min-h-12 w-full rounded-full px-5 text-sm sm:w-auto"
          >
            <Icon name="stop" size={17} className="me-2 inline-block align-[-3px]" />
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
            <Icon name="play" size={18} className="me-2 inline-block align-[-4px]" />
            استئناف
          </button>
          <button
            type="button"
            onClick={onStop}
            className="btn-chrome min-h-12 w-full rounded-full px-5 text-sm sm:w-auto"
          >
            <Icon name="stop" size={17} className="me-2 inline-block align-[-3px]" />
            إنهاء
          </button>
        </div>
      )}

      {phase === 'finished' && (
        <section className={`session-finish-card surface-panel motion-finish-card w-full px-4 py-4 sm:px-5 sm:py-5 ${kind === 'break' ? 'session-finish-break' : ''}`} aria-labelledby="session-finish-title">
          <div className="flex items-start gap-3 text-start">
            <span className="session-finish-mark" aria-hidden="true">
              <Icon name={kind === 'focus' ? 'timer' : 'coffee'} size={24} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="session-finish-eyebrow">
                {kind === 'focus' ? 'خطوة اتحققت' : 'استعدت طاقتك'}
              </p>
              <h2 id="session-finish-title" className="mt-1 text-base font-semibold">
                {kind === 'focus' ? 'أحسنت، خلصت جلستك' : 'انتهت الراحة'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {kind === 'focus'
                  ? 'خد لحظة تقدّر فيها اللي أنجزته.'
                  : 'جاهز ترجع لحاجة ناوي تعملها؟'}
              </p>
            </div>
          </div>
          {elapsedSeconds > 0 && (
            <div className="session-finish-duration mt-4 flex items-center justify-between gap-3 rounded-xl px-3.5 py-3">
              <span className="text-xs text-slate-500">الوقت المستغرق</span>
              <span className="font-mono text-xl font-semibold tabular-nums text-brand-500" dir="ltr">
                {formatDurationShort(elapsedSeconds)}
                {plannedSeconds > 0 && elapsedSeconds < plannedSeconds && (
                  <span className="ms-1 text-xs font-normal text-slate-500">
                    / {formatDurationShort(plannedSeconds)}
                  </span>
                )}
              </span>
            </div>
          )}
          <div className="mt-4 flex w-full flex-col items-stretch gap-2 sm:flex-row">
            {kind === 'focus' && onStartBreak && (
              <button
                type="button"
                onClick={onStartBreak}
                className="btn-secondary-quiet w-full sm:flex-1"
              >
                <Icon name="coffee" size={17} className="me-2 inline-block align-[-3px]" /> بدء الراحة
              </button>
            )}
            <button
              type="button"
              onClick={onReset}
              className={
                kind === 'focus'
                  ? 'btn-chrome min-h-12 w-full rounded-full text-sm sm:flex-1'
                  : 'btn-primary-brand w-full sm:flex-1'
              }
            >
              <Icon name={kind === 'focus' ? 'rotate-ccw' : 'play'} size={17} className="me-2 inline-block align-[-3px]" />{kind === 'focus' ? 'جلسة جديدة' : 'بدء التركيز'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
