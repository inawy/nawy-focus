interface Props {
  open: boolean
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
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
  danger,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="surface-panel w-full max-w-sm px-5 py-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-base font-semibold">
          {title}
        </h2>
        {body && <p className="mt-2 text-sm text-slate-500">{body}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-chrome min-h-11 px-4" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger
                ? 'min-h-11 rounded-xl bg-rose-600 px-5 text-sm font-medium text-white transition hover:bg-rose-500'
                : 'btn-primary-brand min-h-11 px-5 text-sm'
            }
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
