export type AppMode = 'session' | 'stopwatch'

interface Props {
  mode: AppMode
  onChange: (mode: AppMode) => void
  disabled?: boolean
}

const TABS: { id: AppMode; label: string; icon: string }[] = [
  { id: 'stopwatch', label: 'ساعة إيقاف', icon: '⏱' },
  { id: 'session', label: 'جلسة', icon: '⌛' },
]

/** Segmented control inspired by Avast Utilities Focus UI */
export function ModeTabs({ mode, onChange, disabled }: Props) {
  return (
    <div
      className="mode-tabs flex w-full max-w-sm gap-1 rounded-2xl p-1"
      role="tablist"
      aria-label="وضع المؤقت"
    >
      {TABS.map((tab) => {
        const active = mode === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={`mode-tab flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
              active ? 'mode-tab-active' : 'mode-tab-idle'
            } disabled:opacity-40`}
          >
            <span aria-hidden className="text-base leading-none">
              {tab.icon}
            </span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
