import { formatDateTime, formatDurationShort } from '../lib/format'
import {
  formatHourLabel,
  type BestHourResult,
} from '../lib/insights'
import type { HistoryFilter } from '../lib/prefs'
import type { FocusSession } from '../types'

interface Props {
  sessions: FocusSession[]
  filter: HistoryFilter
  onFilterChange: (f: HistoryFilter) => void
  todaySeconds: number
  weekSeconds: number
  todayFocusCount: number
  weekFocusCount: number
  bestHour: BestHourResult | null
  loading: boolean
  onExport: () => void
  onExportCsv: () => void
  onImportFile: (file: File) => void
  onDelete: (id: string) => void
  onCopySession: (session: FocusSession) => void
  backupMessage: string | null
}

const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'today', label: 'اليوم' },
  { id: 'week', label: 'الأسبوع' },
  { id: 'focus', label: 'تركيز' },
  { id: 'break', label: 'راحة' },
]

export function HistoryList({
  sessions,
  filter,
  onFilterChange,
  todaySeconds,
  weekSeconds,
  todayFocusCount,
  weekFocusCount,
  bestHour,
  loading,
  onExport,
  onExportCsv,
  onImportFile,
  onDelete,
  onCopySession,
  backupMessage,
}: Props) {
  return (
    <section className="w-full max-w-md" aria-labelledby="history-heading">
      <details className="group surface-panel open:border-white/10" open>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <h2 id="history-heading" className="text-sm font-medium text-slate-200">
              السجل والملخص
            </h2>
            <span className="text-[11px] text-slate-500 transition group-open:rotate-0">
              <span className="group-open:hidden">إظهار</span>
              <span className="hidden group-open:inline">إخفاء</span>
            </span>
          </div>
          <div className="text-end text-[11px] leading-relaxed text-slate-500">
            <p>
              اليوم {formatDurationShort(todaySeconds)}
              {todayFocusCount > 0 ? ` · ${todayFocusCount} جلسة` : ''}
            </p>
            <p className="text-slate-600">
              الأسبوع {formatDurationShort(weekSeconds)}
              {bestHour ? ` · أفضل ${formatHourLabel(bestHour.hour)}` : ''}
            </p>
          </div>
        </summary>
        <div className="border-t border-slate-800/80 px-3.5 pb-3.5 pt-3">

      <div className="mb-3 flex flex-wrap gap-1 rounded-xl border border-white/[0.05] bg-black/25 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`min-h-11 flex-1 rounded-lg px-1 py-1.5 text-xs font-medium transition ${
              filter === f.id
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={onExport} className="btn-chrome">
          تصدير JSON
        </button>
        <button type="button" onClick={onExportCsv} className="btn-chrome">
          تصدير CSV
        </button>
        <label className="btn-chrome flex cursor-pointer items-center">
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
        <p className="mb-3 text-xs text-brand-400/90" role="status">
          {backupMessage}
        </p>
      )}

      {loading && <p className="text-sm text-slate-500">جاري التحميل…</p>}

      {!loading && sessions.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500">
          لا توجد جلسات في هذا النطاق.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="rounded-xl border border-white/[0.05] bg-black/20 px-3.5 py-2.5 transition hover:border-white/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">
                  {s.intention || (s.kind === 'focus' ? 'تركيز' : 'راحة')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(s.startedAt)}
                  <span className="mx-1 text-slate-600">·</span>
                  {s.kind === 'focus' ? 'تركيز' : 'راحة'}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <div className="text-end">
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
                <button
                  type="button"
                  onClick={() => onCopySession(s)}
                  className="min-h-11 min-w-11 rounded-lg px-1.5 text-xs text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                  title="نسخ ملخص الجلسة"
                  aria-label="نسخ ملخص الجلسة"
                >
                  نسخ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('حذف هذه الجلسة؟')) onDelete(s.id)
                  }}
                  className="min-h-11 min-w-11 rounded-lg px-2 text-slate-500 transition hover:bg-slate-800 hover:text-rose-400"
                  title="حذف"
                  aria-label="حذف الجلسة"
                >
                  ×
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
        </div>
      </details>
    </section>
  )
}
