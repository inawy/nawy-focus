import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  countFocusSessions,
  deleteSession as dbDeleteSession,
  exportSessions,
  importSessions,
  listFocusSessionsForInsights,
  listSessions,
  totalFocusSeconds,
} from '../db'
import { buildBackup, parseBackup } from '../lib/backup'
import { startOfToday, startOfWeek } from '../lib/format'
import {
  bestFocusHour,
  formatSessionShareText,
  type BestHourResult,
} from '../lib/insights'
import {
  loadHistoryFilter,
  saveHistoryFilter,
  type HistoryFilter,
} from '../lib/prefs'
import type { FocusSession } from '../types'

function toCsv(rows: FocusSession[]): string {
  const header = [
    'id',
    'intention',
    'kind',
    'plannedSeconds',
    'actualSeconds',
    'status',
    'startedAt',
    'endedAt',
    'createdAt',
  ]
  const escape = (v: string | number) => {
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.intention,
        r.kind,
        r.plannedSeconds,
        r.actualSeconds,
        r.status,
        r.startedAt,
        r.endedAt,
        r.createdAt,
      ]
        .map(escape)
        .join(','),
    )
  }
  return lines.join('\n')
}

export function useSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [weekSeconds, setWeekSeconds] = useState(0)
  const [todayFocusCount, setTodayFocusCount] = useState(0)
  const [weekFocusCount, setWeekFocusCount] = useState(0)
  const [bestHour, setBestHour] = useState<BestHourResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [filter, setFilterState] = useState<HistoryFilter>(() =>
    loadHistoryFilter(),
  )

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, today, week, focusToday, focusWeek, insightRows] =
        await Promise.all([
          listSessions(120),
          totalFocusSeconds(startOfToday()),
          totalFocusSeconds(startOfWeek()),
          countFocusSessions(startOfToday()),
          countFocusSessions(startOfWeek()),
          listFocusSessionsForInsights(500),
        ])
      setSessions(rows)
      setTodaySeconds(today)
      setWeekSeconds(week)
      setTodayFocusCount(focusToday)
      setWeekFocusCount(focusWeek)
      setBestHour(bestFocusHour(insightRows))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setFilter = useCallback((f: HistoryFilter) => {
    setFilterState(f)
    saveHistoryFilter(f)
  }, [])

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions
    if (filter === 'focus' || filter === 'break') {
      return sessions.filter((s) => s.kind === filter)
    }
    const since = filter === 'today' ? startOfToday() : startOfWeek()
    return sessions.filter((s) => s.startedAt >= since)
  }, [sessions, filter])

  const recentIntentions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of sessions) {
      const t = s.intention.trim()
      if (!t || seen.has(t)) continue
      seen.add(t)
      out.push(t)
      if (out.length >= 5) break
    }
    return out
  }, [sessions])

  const removeSession = useCallback(
    async (id: string) => {
      await dbDeleteSession(id)
      await refresh()
      setBackupMessage('حُذفت الجلسة')
    },
    [refresh],
  )

  const copySessionText = useCallback(async (session: FocusSession) => {
    const text = formatSessionShareText(session)
    try {
      await navigator.clipboard.writeText(text)
      setBackupMessage('نُسخ ملخص الجلسة')
    } catch {
      setBackupMessage('تعذّر النسخ. يمكنك النسخ يدوياً.')
    }
  }, [])

  const downloadBackup = useCallback(async () => {
    const rows = await exportSessions()
    const backup = buildBackup(rows)
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `nawy-focus-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMessage(`تم تصدير ${rows.length} جلسة`)
  }, [])

  const downloadCsv = useCallback(async () => {
    const rows = await exportSessions()
    const blob = new Blob(['\ufeff' + toCsv(rows)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `nawy-focus-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMessage(`تم تصدير CSV (${rows.length} صف)`)
  }, [])

  const uploadBackup = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const parsed = parseBackup(JSON.parse(text) as unknown)
        const inserted = await importSessions(parsed)
        await refresh()
        setBackupMessage(
          inserted === 0
            ? 'لا توجد جلسات جديدة للاستيراد'
            : `تم استيراد ${inserted} جلسة جديدة`,
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'تعذّر الاستيراد'
        setBackupMessage(msg)
      }
    },
    [refresh],
  )

  return {
    sessions: filteredSessions,
    filter,
    setFilter,
    todaySeconds,
    weekSeconds,
    todayFocusCount,
    weekFocusCount,
    bestHour,
    recentIntentions,
    loading,
    refresh,
    removeSession,
    copySessionText,
    downloadBackup,
    downloadCsv,
    uploadBackup,
    backupMessage,
    clearBackupMessage: () => setBackupMessage(null),
  }
}
