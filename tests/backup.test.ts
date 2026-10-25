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

  it('rejects unsupported older and newer backup versions', () => {
    expect(() => parseBackup({ format: 'nawy-focus-backup', version: 0, sessions: [] })).toThrow()
    expect(() => parseBackup({ format: 'nawy-focus-backup', version: 2, sessions: [] })).toThrow()
  })

  it('skips records with non-finite durations or timestamps', () => {
    const backup = buildBackup([
      sample,
      { ...sample, id: 'nan-duration', actualSeconds: Number.NaN },
      { ...sample, id: 'infinite-time', startedAt: Number.POSITIVE_INFINITY },
      { ...sample, id: 'bad-created', createdAt: Number.NaN },
    ])
    expect(parseBackup(backup).map((row) => row.id)).toEqual(['a1'])
  })

  it('skips sessions with impossible durations or reversed timestamps', () => {
    const backup = buildBackup([
      sample,
      { ...sample, id: 'zero-plan', plannedSeconds: 0 },
      { ...sample, id: 'too-long-plan', plannedSeconds: 10_801 },
      { ...sample, id: 'reversed-time', startedAt: 2_000, endedAt: 1_000 },
    ])
    expect(parseBackup(backup).map((row) => row.id)).toEqual(['a1'])
  })

  it('skips sessions whose actual duration exceeds the planned duration', () => {
    const backup = buildBackup([
      sample,
      { ...sample, id: 'overrun', actualSeconds: 1501, plannedSeconds: 1500 },
    ])
    expect(parseBackup(backup).map((row) => row.id)).toEqual(['a1'])
  })

  it('deduplicates repeated session ids in imported backups', () => {
    const duplicate = { ...sample, intention: 'نسخة مكررة' }
    expect(parseBackup(buildBackup([sample, duplicate]))).toHaveLength(1)
    expect(parseBackup(buildBackup([sample, duplicate]))[0]?.intention).toBe('كتابة')
  })

  it('merge keeps existing and adds new', () => {
    const other: FocusSession = { ...sample, id: 'b2', intention: 'قراءة' }
    const merged = mergeSessions([sample], [sample, other])
    expect(merged).toHaveLength(2)
    expect(merged.find((s) => s.id === 'a1')?.intention).toBe('كتابة')
  })
})
