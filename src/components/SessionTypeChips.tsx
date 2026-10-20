import type { SessionKind } from '../types'

export interface SessionPreset {
  id: string
  label: string
  kind: SessionKind
  /** Optional default minutes when selecting this preset */
  minutes?: number
  /** Intention text applied when selected */
  intention?: string
  /** Accent for chip (css color token name) */
  tone: 'brand' | 'orange' | 'green' | 'purple' | 'pink' | 'teal'
  icon: string
}

export const SESSION_PRESETS: SessionPreset[] = [
  {
    id: 'focus',
    label: 'تركيز',
    kind: 'focus',
    minutes: 25,
    tone: 'brand',
    icon: '◎',
  },
  {
    id: 'coffee',
    label: 'استراحة قهوة',
    kind: 'break',
    minutes: 5,
    intention: 'استراحة قهوة',
    tone: 'orange',
    icon: '☕',
  },
  {
    id: 'exercise',
    label: 'تمرين',
    kind: 'break',
    minutes: 10,
    intention: 'تمرين خفيف',
    tone: 'green',
    icon: '🏃',
  },
  {
    id: 'read',
    label: 'قراءة',
    kind: 'focus',
    minutes: 30,
    intention: 'قراءة',
    tone: 'purple',
    icon: '📖',
  },
  {
    id: 'relax',
    label: 'استرخاء',
    kind: 'break',
    minutes: 15,
    intention: 'استرخاء',
    tone: 'pink',
    icon: '♡',
  },
]

interface Props {
  kind: SessionKind
  intention: string
  selectedId?: string
  onSelect: (preset: SessionPreset) => void
  disabled?: boolean
}

export function SessionTypeChips({
  kind,
  intention,
  selectedId,
  onSelect,
  disabled,
}: Props) {
  const activeId =
    selectedId ??
    SESSION_PRESETS.find(
      (p) =>
        p.kind === kind &&
        (p.intention ? intention.includes(p.intention) : !intention),
    )?.id ??
    (kind === 'focus' ? 'focus' : 'coffee')

  return (
    <div className="flex w-full max-w-sm flex-wrap justify-center gap-2">
      {SESSION_PRESETS.map((p) => {
        const active = activeId === p.id
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(p)}
            aria-pressed={active}
            className={`session-chip session-chip-${p.tone} min-h-10 rounded-xl px-3.5 text-sm font-medium transition disabled:opacity-40 ${
              active ? 'session-chip-active' : ''
            }`}
          >
            <span aria-hidden className="me-1.5">
              {p.icon}
            </span>
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
