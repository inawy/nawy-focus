import type { FormEvent } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  suggestions?: string[]
  onSubmit?: () => void
}

export function IntentionInput({
  value,
  onChange,
  disabled,
  suggestions = [],
  onSubmit,
}: Props) {
  const onForm = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-1.5"
      onSubmit={onForm}
    >
      <label className="type-caption px-0.5 text-end" htmlFor="intention">
        نية اختيارية
      </label>
      <input
        id="intention"
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="مثال: كتابة التقرير…"
        autoComplete="off"
        enterKeyHint="go"
        className="surface-field min-h-11 w-full rounded-xl px-3.5 text-sm outline-none transition focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-40"
      />
      {suggestions.length > 0 && !value && !disabled && (
        <div className="flex flex-wrap justify-end gap-1.5 pt-0.5">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="surface-chip max-w-[10rem] truncate px-2.5 py-1 text-[11px] text-slate-500 transition hover:text-inherit"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  )
}
