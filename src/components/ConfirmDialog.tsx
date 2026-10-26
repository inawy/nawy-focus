import { useEffect, useId, useRef } from 'react'
import { Icon } from './Icon'

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
  return <Icon name={tone === 'danger' ? 'alert-triangle' : 'info'} size={24} />
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
          'button:not(:disabled), [href]:not([tabindex="-1"]), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [contenteditable="true"], [role="button"], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => {
        const style = window.getComputedStyle(el)
        return (
          !el.closest('[hidden], [inert], [aria-hidden="true"]') &&
          el.getAttribute('aria-disabled') !== 'true' &&
          style.visibility !== 'hidden' &&
          style.visibility !== 'collapse' &&
          el.getClientRects().length > 0
        )
      })

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
        const active = document.activeElement
        const focusIsInside = panelRef.current?.contains(active)
        if (e.shiftKey && (active === first || !focusIsInside)) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && (active === last || !focusIsInside)) {
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
