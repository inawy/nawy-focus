import type { FocusSession } from '../types'

export const BACKUP_VERSION = 1 as const

export interface BackupPayload {
  version: typeof BACKUP_VERSION
  exportedAt: string
  sessions: FocusSession[]
}

export function buildBackup(sessions: FocusSession[]): BackupPayload {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    sessions,
  }
}

export function parseBackup(raw: unknown): FocusSession[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('الملف غير صالح')
  }
  const data = raw as Record<string, unknown>
  if (data.version === undefined && !Array.isArray(data.sessions)) {
    throw new Error('هذا ليس ملف نسخ احتياطي لناوي فوكاس')
  }
  if (data.version !== undefined && data.version !== BACKUP_VERSION) {
    throw new Error('إصدار النسخة الاحتياطية غير مدعوم')
  }
  const sessions = data.sessions
  if (!Array.isArray(sessions) || sessions.length === 0) {
    throw new Error('لا توجد جلسات في الملف')
  }
  return sessions as FocusSession[]
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadText(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
