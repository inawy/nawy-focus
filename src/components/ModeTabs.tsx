export type AppMode = 'session' | 'stopwatch'

interface Props {
  mode: AppMode
  onChange: (mode: AppMode) => void
  disabled?: boolean
}

const TABS: { id: AppMode; label: string; icon: string }[] = [
  { id: 'session', label: 'جلسة', icon: '⌛' },
  { id: 'stopwatch', label: 'ساعة إيقاف', icon: '⏱' },
]

/** Mobile-first segmented control for switching timer modes. */
export function ModeTabs({ mode, onChange, disabled }: Props) {
  const moveFocus = (current: AppMode, direction: -1 | 1) => {
    const index = TABS.findIndex((tab) => tab.id === current)
    const next = TABS[(index + direction + TABS.length) % TABS.length]
    onChange(next.id)
    document.getElementById(`mode-tab-${next.id}`)?.focus()
  }

  return (
    <div
      className="mode-tabs flex w-full items-stretch gap-1 rounded-2xl p-1"
      role="tablist"
      aria-label="وضع المؤقت"
      dir="rtl"
    >
      {TABS.map((tab) => {
        const active = mode === tab.id
        return (
          <button
            key={tab.id}
            id={`mode-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="timer-mode-panel"
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveFocus(tab.id, 1)
              } else if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveFocus(tab.id, -1)
              } else if (event.key === 'Home') {
                event.preventDefault()
                onChange(TABS[0].id)
                document.getElementById(`mode-tab-${TABS[0].id}`)?.focus()
              } else if (event.key === 'End') {
                event.preventDefault()
                onChange(TABS[TABS.length - 1].id)
                document.getElementById(`mode-tab-${TABS[TABS.length - 1].id}`)?.focus()
              }
            }}
            className={`mode-tab flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${active ? 'mode-tab-active' : 'mode-tab-idle'} disabled:opacity-40`}
          >
            <span aria-hidden className="shrink-0 text-base leading-none">
              {tab.icon}
            </span>
            <span className="mode-tab-label">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
