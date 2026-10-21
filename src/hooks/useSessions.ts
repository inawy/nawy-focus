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
import { toCsv } from '../lib/csv'
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

export function useSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [weekSeconds, setWeekSeconds] = useState(0)
  const [todayFocusCount, setTodayFocusCount] = useState(0)
  const [weekFocusCount, setWeekFocusCount] = useState(0)
  const [bestHour, setBestHour] = useState<BestHourResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState<string | null>(null)
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
      setStorageError(null)
    } catch {
      setStorageError('تعذّر تحميل سجل الجلسات من التخزين المحلي. بياناتك السابقة لم تُحذف؛ جرّب إعادة التحميل.')
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
      try {
        await dbDeleteSession(id)
        await refresh()
        setBackupMessage('حُذفت الجلسة')
      } catch {
        setBackupMessage('تعذّر حذف الجلسة من التخزين المحلي. لم يتم تأكيد الحذف.')
      }
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
    let url: string | null = null
    try {
      const rows = await exportSessions()
      const backup = buildBackup(rows)
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      })
      url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `nawy-focus-backup-${stamp}.json`
      a.click()
      setBackupMessage(`تم تجهيز النسخة الاحتياطية (${rows.length} جلسة)`)
    } catch {
      setBackupMessage('تعذّر إنشاء النسخة الاحتياطية. بياناتك المحلية لم يتم حذفها.')
    } finally {
      const objectUrl = url
      if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    }
  }, [])

  const downloadCsv = useCallback(async () => {
    let url: string | null = null
    try {
      const rows = await exportSessions()
      const blob = new Blob(['\uFEFF' + toCsv(rows)], {
        type: 'text/csv;charset=utf-8',
      })
      url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `nawy-focus-${stamp}.csv`
      a.click()
      setBackupMessage(`تم تجهيز ملف CSV (${rows.length} صف)`)
    } catch {
      setBackupMessage('تعذّر تجهيز ملف CSV. بياناتك المحلية لم يتم حذفها.')
    } finally {
      const objectUrl = url
      if (objectUrl) window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    }
  }, [])

  const uploadBackup = useCallback(
    async (file: File) => {
      let raw: unknown
      try {
        raw = JSON.parse(await file.text()) as unknown
      } catch {
        setBackupMessage('تعذّرت قراءة الملف. تأكد أنه ملف JSON سليم وغير تالف.')
        return
      }

      let parsed: FocusSession[]
      try {
        parsed = parseBackup(raw)
      } catch (err) {
        setBackupMessage(
          err instanceof Error
            ? err.message
            : 'الملف غير صالح أو لا يتوافق مع نسخة ناوي فوكاس.',
        )
        return
      }

      try {
        const inserted = await importSessions(parsed)
        await refresh()
        setBackupMessage(
          inserted === 0
            ? 'لا توجد جلسات جديدة للاستيراد'
            : `تم استيراد ${inserted} جلسة جديدة`,
        )
      } catch {
        setBackupMessage(
          'تعذّر استيراد الجلسات إلى التخزين المحلي. لم يتم تأكيد اكتمال الاستيراد؛ تحقق من السجل قبل إعادة المحاولة.',
        )
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
    storageError,
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
