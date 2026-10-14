interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function IntentionInput({ value, onChange, disabled }: Props) {
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
        className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
        autoComplete="off"
        enterKeyHint="done"
      />
    </label>
  )
}
