import type { FocusSession } from '../types'

export const BACKUP_FORMAT = 'nawy-focus-backup' as const
export const BACKUP_VERSION = 1 as const

export interface FocusBackup {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: number
  sessions: FocusSession[]
}

export function buildBackup(sessions: FocusSession[], exportedAt = Date.now()): FocusBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt,
    sessions,
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function parseBackup(raw: unknown): FocusSession[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('الملف غير صالح')
  }
  const obj = raw as Record<string, unknown>
  if (obj.format !== BACKUP_FORMAT) {
    throw new Error('هذا ليس ملف نسخ احتياطي لناوي فوكاس')
  }
  if (obj.version !== BACKUP_VERSION) {
    throw new Error('إصدار النسخة الاحتياطية غير مدعوم')
  }
  if (!Array.isArray(obj.sessions)) {
    throw new Error('لا توجد جلسات في الملف')
  }

  const out: FocusSession[] = []
  for (const item of obj.sessions) {
    if (!item || typeof item !== 'object') continue
    const s = item as Record<string, unknown>
    if (typeof s.id !== 'string' || !s.id.trim()) continue
    if (s.kind !== 'focus' && s.kind !== 'break') continue
    if (!isFiniteNumber(s.actualSeconds) || s.actualSeconds < 0) continue
    if (!isFiniteNumber(s.plannedSeconds) || s.plannedSeconds < 0) continue
    if (!isFiniteNumber(s.startedAt) || !isFiniteNumber(s.endedAt)) continue
    if (
      s.status !== undefined &&
      s.status !== 'completed' &&
      s.status !== 'stopped' &&
      s.status !== 'abandoned'
    ) continue
    if (s.createdAt !== undefined && !isFiniteNumber(s.createdAt)) continue

    const status =
      s.status === 'completed' || s.status === 'stopped' || s.status === 'abandoned'
        ? s.status
        : 'completed'
    out.push({
      id: s.id,
      intention: typeof s.intention === 'string' ? s.intention : '',
      kind: s.kind,
      plannedSeconds: s.plannedSeconds,
      actualSeconds: s.actualSeconds,
      status,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      createdAt: isFiniteNumber(s.createdAt) ? s.createdAt : s.startedAt,
    })
  }
  return out
}

/** Merge by id: keep existing rows, add missing ones only (safe import). */
export function mergeSessions(
  existing: FocusSession[],
  incoming: FocusSession[],
): FocusSession[] {
  const map = new Map<string, FocusSession>()
  for (const s of existing) map.set(s.id, s)
  for (const s of incoming) {
    if (!map.has(s.id)) map.set(s.id, s)
  }
  return Array.from(map.values()).sort((a, b) => a.startedAt - b.startedAt)
}
