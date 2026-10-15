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
    <label className="block w-full max-w-md">
      <span className="mb-1.5 block text-sm text-slate-400">
        نية التركيز (اختياري)
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="مثال: كتابة التقرير، مراجعة الكود…"
        maxLength={120}
        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
        autoComplete="off"
        enterKeyHint="done"
      />
      {!disabled && suggestions.length > 0 && !value && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="min-h-9 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </label>
  )
}
