interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  suggestions?: string[]
  /** Called when user presses Enter (not Shift+Enter) */
  onSubmit?: () => void
}

export function IntentionInput({
  value,
  onChange,
  disabled,
  suggestions = [],
  onSubmit,
}: Props) {
  return (
    <label className="block w-full max-w-sm">
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        نية التركيز
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && onSubmit && !disabled) {
            e.preventDefault()
            onSubmit()
          }
        }}
        disabled={disabled}
        placeholder="مثال: كتابة التقرير…"
        maxLength={120}
        className="surface-field w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none transition focus:border-brand-500/40 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50"
        autoComplete="off"
        enterKeyHint="go"
      />
      {!disabled && suggestions.length > 0 && !value && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="surface-chip min-h-9 rounded-full px-3.5 py-1 text-xs text-slate-500 transition hover:text-inherit"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </label>
  )
}
