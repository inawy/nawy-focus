import { useEffect, useId, useRef } from 'react'

export type ConfirmTone = 'default' | 'danger' | 'notice'

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

function toneFromProps(notice?: boolean, danger?: boolean): ConfirmTone {
  if (danger) return 'danger'
  if (notice) return 'notice'
  return 'default'
}

function ConfirmIcon({ tone }: { tone: ConfirmTone }) {
  if (tone === 'danger') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <path
          d="M12 9v4.5M12 17h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10.3 4.3 2.6 18a2 2 0 0 0 1.75 3h15.3a2 2 0 0 0 1.75-3L13.7 4.3a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  if (tone === 'notice') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M12 8v5M12 16h.01"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 11.5V17M12 8h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
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
  const onCancelRef = useRef(onCancel)
  const titleId = useId()
  const bodyId = useId()
  const tone = toneFromProps(notice, danger)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    if (!open) return

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const getFocusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.getAttribute('aria-hidden') !== 'true')

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancelRef.current()
        return
      }

      if (e.key === 'Tab') {
        const focusable = getFocusable()
        if (focusable.length === 0) {
          e.preventDefault()
          panelRef.current?.focus()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
        return
      }

    }

    document.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => {
      const btn = panelRef.current?.querySelector<HTMLButtonElement>(
        '[data-confirm-primary]',
      )
      btn?.focus()
    }, 30)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  const toneClass =
    tone === 'danger'
      ? 'confirm-tone-danger'
      : tone === 'notice'
        ? 'confirm-tone-notice'
        : 'confirm-tone-default'

  return (
    <div
      className="confirm-overlay fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
      onClick={onCancel}
    >
      <div
        ref={panelRef}
        className={`confirm-panel ${toneClass} mx-0 w-full max-w-[22rem] overflow-hidden rounded-t-[1.75rem] sm:mx-auto sm:rounded-[1.75rem]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body ? bodyId : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-accent" aria-hidden />

        <div className="confirm-handle sm:hidden" aria-hidden />

        <div className="px-5 pb-[max(1.35rem,env(safe-area-inset-bottom))] pt-1 sm:px-6 sm:pb-6 sm:pt-2">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
            <div className="confirm-icon-wrap" aria-hidden>
              <ConfirmIcon tone={tone} />
            </div>

            <h2
              id={titleId}
              className="mt-3.5 text-[1.05rem] font-semibold leading-snug tracking-tight"
            >
              {title}
            </h2>

            {body && (
              <p
                id={bodyId}
                className="mt-2 max-w-[18rem] text-[13.5px] leading-relaxed text-slate-500 sm:max-w-none"
              >
                {body}
              </p>
            )}
          </div>

          <div
            className={
              notice
                ? 'mt-6 flex flex-col'
                : 'mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-stretch'
            }
          >
            {!notice && (
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              data-confirm-primary
              className={
                tone === 'danger'
                  ? 'confirm-btn-danger'
                  : 'confirm-btn-primary'
              }
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
