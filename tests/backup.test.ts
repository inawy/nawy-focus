import { describe, expect, it } from 'vitest'
import { buildBackup, mergeSessions, parseBackup } from '../src/lib/backup'
import type { FocusSession } from '../src/types'

const sample: FocusSession = {
  id: 'a1',
  intention: 'كتابة',
  kind: 'focus',
  plannedSeconds: 1500,
  actualSeconds: 900,
  status: 'completed',
  startedAt: 1_000,
  endedAt: 1_900_000,
  createdAt: 1_000,
}

describe('backup', () => {
  it('round-trips sessions', () => {
    const backup = buildBackup([sample], 42)
    const json = JSON.parse(JSON.stringify(backup)) as unknown
    const rows = parseBackup(json)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('a1')
    expect(rows[0]?.intention).toBe('كتابة')
  })

  it('rejects wrong format', () => {
    expect(() => parseBackup({ format: 'other', version: 1, sessions: [] })).toThrow()
  })

  it('merge keeps existing and adds new', () => {
    const other: FocusSession = { ...sample, id: 'b2', intention: 'قراءة' }
    const merged = mergeSessions([sample], [sample, other])
    expect(merged).toHaveLength(2)
    expect(merged.find((s) => s.id === 'a1')?.intention).toBe('كتابة')
  })
})
