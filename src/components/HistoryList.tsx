import { formatDateTime, formatDurationShort } from '../lib/format'
import type { FocusSession } from '../types'

interface Props {
  sessions: FocusSession[]
  todaySeconds: number
  loading: boolean
}

export function HistoryList({ sessions, todaySeconds, loading }: Props) {
  return (
    <section className="w-full max-w-md" aria-labelledby="history-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="history-heading" className="text-sm font-medium text-slate-300">
          سجل التركيز
        </h2>
        <p className="text-xs text-slate-500">
          اليوم: {formatDurationShort(todaySeconds)}
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">جاري التحميل…</p>
      )}

      {!loading && sessions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
          لا توجد جلسات بعد. ابدأ أول جلسة تركيز.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">
                  {s.intention || (s.kind === 'focus' ? 'تركيز' : 'راحة')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(s.startedAt)}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-sm font-medium tabular-nums text-slate-200">
                  {formatDurationShort(s.actualSeconds)}
                </p>
                <p className="text-[11px] text-slate-500">
                  {s.status === 'completed'
                    ? 'مكتملة'
                    : s.status === 'stopped'
                      ? 'مُنهَاة'
                      : 'متروكة'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
