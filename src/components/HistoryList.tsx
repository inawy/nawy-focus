import { formatDateTime, formatDurationShort } from '../lib/format'
import type { FocusSession } from '../types'

interface Props {
  sessions: FocusSession[]
  todaySeconds: number
  weekSeconds: number
  loading: boolean
  onExport: () => void
  onImportFile: (file: File) => void
  backupMessage: string | null
}

export function HistoryList({
  sessions,
  todaySeconds,
  weekSeconds,
  loading,
  onExport,
  onImportFile,
  backupMessage,
}: Props) {
  return (
    <section className="w-full max-w-md" aria-labelledby="history-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="history-heading" className="text-sm font-medium text-slate-300">
          سجل التركيز
        </h2>
        <div className="text-end text-xs text-slate-500">
          <p>اليوم: {formatDurationShort(todaySeconds)}</p>
          <p>هذا الأسبوع: {formatDurationShort(weekSeconds)}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          تصدير JSON
        </button>
        <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100">
          استيراد
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImportFile(file)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {backupMessage && (
        <p className="mb-3 text-xs text-emerald-400/90" role="status">
          {backupMessage}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">جاري التحميل…</p>}

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
