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
              السجل
            </h2>
            <span className="text-[11px] text-slate-500 transition group-open:rotate-0">
              <span className="group-open:hidden">عرض</span>
              <span className="hidden group-open:inline">طيّ</span>
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
              {bestHour ? ` · أفضل ساعة: ${formatHourLabel(bestHour.hour)}` : ''}
            </p>
          </div>
        </summary>

        <div className="space-y-3 border-t border-current/10 px-3.5 pb-3.5 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange(f.id)}
                className={`min-h-9 rounded-full px-3 text-xs font-medium transition ${
                  filter === f.id
                    ? 'bg-brand-500/20 text-brand-500'
                    : 'text-slate-500 hover:text-inherit'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="ms-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onExport}
                className="min-h-9 rounded-lg px-2 text-[11px] text-slate-500 transition hover:text-inherit"
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
                className="min-h-9 cursor-pointer rounded-lg px-2 text-[11px] text-slate-500 transition hover:text-inherit"
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
                  className="history-row-enter surface-row rounded-xl px-3 py-2.5"
                  style={{ animationDelay: `${Math.min(index, 6) * 35}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {s.intention || (s.kind === 'focus' ? 'تركيز' : 'راحة')}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(s.startedAt)}
                        <span className="mx-1 opacity-50">·</span>
                        {s.kind === 'focus' ? 'تركيز' : 'راحة'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="text-end">
                        <p className="text-sm font-medium tabular-nums">
                          {formatDurationShort(s.actualSeconds)}
                        </p>
                        <p className="text-[11px] text-slate-500">
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
                        className="min-h-11 min-w-11 rounded-lg px-1.5 text-xs text-slate-500 transition hover:bg-black/5 hover:opacity-100"
                        title="نسخ ملخص الجلسة"
                        aria-label="نسخ ملخص الجلسة"
                      >
                        نسخ
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(s.id)}
                        className="min-h-11 min-w-11 rounded-lg px-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-500"
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
