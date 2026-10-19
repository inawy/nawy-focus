import { useState } from 'react'
import { formatDateTime, formatDurationShort } from '../lib/format'
import {
  formatHourLabel,
  type BestHourResult,
} from '../lib/insights'
import type { HistoryFilter } from '../lib/prefs'
import type { FocusSession } from '../types'
import { ConfirmDialog } from './ConfirmDialog'

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
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <section className="w-full max-w-md" aria-labelledby="history-heading">
      <details className="group surface-panel">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <h2 id="history-heading" className="text-sm font-medium">
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
            <p className="text-slate-500 opacity-80">
              الأسبوع {formatDurationShort(weekSeconds)}
              {weekFocusCount > 0 ? ` · ${weekFocusCount} جلسة` : ''}
              {bestHour ? ` · أفضل ${formatHourLabel(bestHour.hour)}` : ''}
            </p>
          </div>
        </summary>

        <div className="border-t border-current/5 px-3.5 pb-3.5 pt-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onFilterChange(id)}
                className={`min-h-9 rounded-full px-3 text-xs font-medium transition ${
                  filter === id
                    ? 'bg-brand-500 text-white'
                    : 'surface-chip text-slate-500 hover:text-inherit'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">جاري التحميل…</p>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              لا جلسات بعد. ابدأ أول تركيز.
            </p>
          ) : (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {sessions.map((s, i) => (
                <li
                  key={s.id}
                  className="history-row-enter surface-row flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <div className="min-w-0 text-start">
                    <p className="truncate text-sm font-medium">
                      {s.intention || (s.kind === 'break' ? 'راحة' : 'تركيز')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {formatDateTime(s.endedAt ?? s.startedAt)} ·{' '}
                      {formatDurationShort(s.elapsedSeconds)}
                      {s.kind === 'break' ? ' · راحة' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="btn-chrome min-h-9 px-2 text-[11px]"
                      onClick={() => onCopySession(s)}
                      title="نسخ"
                    >
                      نسخ
                    </button>
                    <button
                      type="button"
                      className="btn-chrome min-h-9 px-2 text-[11px] text-rose-400"
                      onClick={() => setPendingDelete(s.id)}
                      title="حذف"
                    >
                      حذف
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-chrome text-[11px]" onClick={onExport}>
              تصدير JSON
            </button>
            <button type="button" className="btn-chrome text-[11px]" onClick={onExportCsv}>
              CSV
            </button>
            <label className="btn-chrome cursor-pointer text-[11px]">
              استيراد
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onImportFile(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {backupMessage && (
            <p className="mt-2 text-center text-[11px] text-brand-500" role="status">
              {backupMessage}
            </p>
          )}
        </div>
      </details>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="حذف الجلسة؟"
        body="لن يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete)
          setPendingDelete(null)
        }}
      />
    </section>
  )
}
