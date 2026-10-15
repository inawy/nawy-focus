interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  suggestions?: string[]
}

export function IntentionInput({
  value,
  onChange,
  disabled,
  suggestions = [],
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
        disabled={disabled}
        placeholder="مثال: كتابة التقرير…"
        maxLength={120}
        className="w-full rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-3.5 text-[15px] text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-brand-500/40 focus:bg-black/35 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50"
        autoComplete="off"
        enterKeyHint="done"
      />
      {!disabled && suggestions.length > 0 && !value && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="min-h-9 rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-1 text-xs text-slate-400 transition hover:border-white/15 hover:text-slate-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </label>
  )
}
