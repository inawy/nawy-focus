import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Single primary button only (for notices) */
  notice?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  notice,
  danger,
  onConfirm,
  onCancel,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = window.setTimeout(() => {
      const btn = panelRef.current?.querySelector<HTMLButtonElement>(
        '[data-confirm-primary]',
      )
      btn?.focus()
    }, 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      window.clearTimeout(t)
    }
  }, [open, onCancel])

  if (!open) return null

  const icon = notice ? 'ℹ' : danger ? '!' : '?'

  return (
    <div
      className="confirm-overlay fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className="confirm-panel surface-panel mx-0 w-full max-w-md rounded-t-3xl border-b-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:mx-4 sm:rounded-3xl sm:border-b sm:pb-5 sm:pt-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={body ? 'confirm-body' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-current opacity-15 sm:hidden"
          aria-hidden
        />

        <div className="flex gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
              danger
                ? 'bg-rose-500/15 text-rose-500'
                : notice
                  ? 'bg-amber-500/15 text-amber-600'
                  : 'bg-brand-500/15 text-brand-500'
            }`}
            aria-hidden
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id="confirm-title" className="text-[15px] font-semibold leading-snug">
              {title}
            </h2>
            {body && (
              <p id="confirm-body" className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {body}
              </p>
            )}
          </div>
        </div>

        <div
          className={`mt-5 flex gap-2 ${
            notice ? 'flex-col' : 'flex-col-reverse sm:flex-row sm:justify-end'
          }`}
        >
          {!notice && (
            <button
              type="button"
              className="btn-chrome min-h-12 flex-1 rounded-2xl px-4 text-sm sm:flex-none sm:min-w-[7rem]"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            data-confirm-primary
            className={
              danger
                ? 'min-h-12 flex-1 rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-[0.98] sm:flex-none sm:min-w-[8rem]'
                : notice
                  ? 'btn-primary-brand min-h-12 w-full rounded-2xl text-sm'
                  : 'btn-primary-brand min-h-12 flex-1 rounded-2xl px-5 text-sm sm:flex-none sm:min-w-[8rem]'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
