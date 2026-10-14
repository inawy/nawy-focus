import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  exportSessions,
  importSessions,
  listSessions,
  totalFocusSeconds,
} from '../db'
import { buildBackup, parseBackup } from '../lib/backup'
import { startOfToday, startOfWeek } from '../lib/format'
import {
  loadHistoryFilter,
  saveHistoryFilter,
  type HistoryFilter,
} from '../lib/prefs'
import type { FocusSession } from '../types'

export function useSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [weekSeconds, setWeekSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [filter, setFilterState] = useState<HistoryFilter>(() => loadHistoryFilter())

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, today, week] = await Promise.all([
        listSessions(80),
        totalFocusSeconds(startOfToday()),
        totalFocusSeconds(startOfWeek()),
      ])
      setSessions(rows)
      setTodaySeconds(today)
      setWeekSeconds(week)
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
    const since = filter === 'today' ? startOfToday() : startOfWeek()
    return sessions.filter((s) => s.startedAt >= since)
  }, [sessions, filter])

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

  const uploadBackup = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const parsed = parseBackup(JSON.parse(text) as unknown)
        const inserted = await importSessions(parsed)
        await refresh()
        setBackupMessage(
          inserted === 0
            ? 'لا جلسات جديدة للاستيراد'
            : `تم استيراد ${inserted} جلسة جديدة`,
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'فشل الاستيراد'
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
    loading,
    refresh,
    downloadBackup,
    uploadBackup,
    backupMessage,
    clearBackupMessage: () => setBackupMessage(null),
  }
}
