import { describe, expect, it } from 'vitest'
import { toCsv } from '../src/lib/csv'
import type { FocusSession } from '../src/types'

const session: FocusSession = {
  id: 'csv-1',
  intention: 'كتابة, ومراجعة',
  kind: 'focus',
  plannedSeconds: 1500,
  actualSeconds: 900,
  status: 'completed',
  startedAt: 1_000,
  endedAt: 901_000,
  createdAt: 1_000,
}

describe('CSV export', () => {
  it('quotes commas, quotes, and line breaks correctly', () => {
    const newline = String.fromCharCode(10)
    const csv = toCsv([{ ...session, intention: 'مراجعة, "الملف"' + newline + 'اليوم' }])
    expect(csv).toContain('"مراجعة, ""الملف""' + newline + 'اليوم"')
  })

  it('neutralizes formula-like user text without changing numeric fields', () => {
    const csv = toCsv([
      { ...session, id: 'equals', intention: '=1+1' },
      { ...session, id: 'plus', intention: '+SUM(A1:A2)' },
      { ...session, id: 'at', intention: '  @SUM(A1:A2)' },
      { ...session, id: 'minus', intention: '-cmd' },
    ])
    expect(csv).toContain("'=1+1")
    expect(csv).toContain("'+SUM(A1:A2)")
    expect(csv).toContain("'  @SUM(A1:A2)")
    expect(csv).toContain("'-cmd")
    expect(csv).toContain(',1500,900,completed,')
  })

  it('exports an empty history with its header', () => {
    expect(toCsv([])).toBe('id,intention,kind,plannedSeconds,actualSeconds,status,startedAt,endedAt,createdAt')
  })
})
