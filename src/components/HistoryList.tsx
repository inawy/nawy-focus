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
    <section className="history-section w-full max-w-md" aria-labelledby="history-heading">
      <details className="history-disclosure group surface-panel">
        <summary className="history-summary flex cursor-pointer list-none flex-col items-stretch justify-between gap-2.5 px-3.5 py-3 sm:flex-row sm:items-center sm:gap-3 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2">
            <span className="history-heading-mark" aria-hidden>•/</span>
            <h2 id="history-heading" className="text-sm font-semibold">
              السجل
            </h2>
            <span className="text-[11px] text-slate-500 transition group-open:rotate-0">
              <span className="group-open:hidden">عرض</span>
              <span className="hidden group-open:inline">طيّ</span>
            </span>
          </div>
          <div className="text-start text-[11px] leading-relaxed text-slate-500 sm:text-end">
            <p>
              اليوم {formatDurationShort(todaySeconds)}
              {todayFocusCount > 0 ? ` · ${todayFocusCount} جلسة` : ''}
            </p>
            <p className="text-slate-500 opacity-80">
              الأسبوع {formatDurationShort(weekSeconds)}
              {weekFocusCount > 0 ? ` · ${weekFocusCount} جلسة` : ''}
              {bestHour ? ` · أفضل ساعة: ${formatHourLabel(bestHour.hour)}` : ''}
            </p>
          </div>
        </summary>

        <div className="space-y-3 border-t border-current/10 px-3.5 pb-3.5 pt-3">
          <div className="history-toolbar flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                className={`history-filter-btn min-h-9 rounded-full px-3 text-xs font-medium transition ${
                  filter === f.id
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'text-slate-500 hover:text-inherit'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="history-tools flex flex-wrap items-center justify-end gap-1 border-t border-current/10 pt-1 sm:ms-auto sm:border-0 sm:pt-0">
              <button
                type="button"
                onClick={onExport}
                className="min-h-10 min-w-10 rounded-lg px-2 text-[11px] text-slate-500 transition hover:text-inherit"
                title="تصدير بصيغة JSON"
              >
                JSON
              </button>
              <button
                type="button"
                onClick={onExportCsv}
                className="min-h-9 rounded-lg px-2 text-[11px] text-slate-500 transition hover:text-inherit"
                title="تصدير بصيغة CSV"
              >
                CSV
              </button>
              <label
                className="inline-flex min-h-10 items-center rounded-lg px-2 text-[11px] text-slate-500 transition hover:text-inherit"
                title="استيراد نسخة احتياطية"
              >
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
          </div>

          {backupMessage && (
            <p className="text-center text-xs text-brand-500" role="status">
              {backupMessage}
            </p>
          )}

          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">جارٍ التحميل…</p>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              لا توجد جلسات بعد. ابدأ أول جلسة تركيز.
            </p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto overscroll-contain">
              {sessions.map((s, index) => (
                <li
                  key={s.id}
                  className="history-row history-row-enter surface-row rounded-xl px-3 py-2.5"
                  style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }}
                >
                  <div className="history-row-content flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="history-row-description min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {s.intention || (s.kind === 'focus' ? 'تركيز' : 'راحة')}
                      </p>
                      <p className="history-row-meta mt-0.5 text-xs text-slate-500">
                        {formatDateTime(s.startedAt)}
                        <span className="mx-1 opacity-50">·</span>
                        {s.kind === 'focus' ? 'تركيز' : 'راحة'}
                      </p>
                    </div>
                    <div className="history-row-actions flex w-full min-w-0 items-center justify-between gap-1 sm:w-auto sm:shrink-0 sm:justify-start">
                      <div className="text-end">
                        <p className="text-sm font-medium tabular-nums">
                          {formatDurationShort(s.actualSeconds)}
                        </p>
                        <p className={`history-status history-status-${s.status} text-[11px] text-slate-500`}>
                          {s.status === 'completed'
                            ? 'مكتملة'
                            : s.status === 'stopped'
                              ? 'مُنهاة'
                              : 'غير مكتملة'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopySession(s)}
                        className="min-h-11 min-w-11 shrink-0 rounded-lg px-1.5 text-xs text-slate-500 transition hover:bg-black/5 hover:opacity-100"
                        title="نسخ ملخص الجلسة"
                        aria-label="نسخ ملخص الجلسة"
                      >
                        نسخ
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(s.id)}
                        className="history-delete min-h-11 min-w-11 shrink-0 rounded-lg px-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-500"
                        title="حذف الجلسة"
                        aria-label="حذف الجلسة"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="حذف الجلسة؟"
        body="لا يمكن التراجع عن هذا الإجراء."
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
