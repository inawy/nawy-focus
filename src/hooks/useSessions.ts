import { useCallback, useEffect, useState } from 'react'
import { listSessions, totalFocusSeconds } from '../db'
import { startOfToday } from '../lib/format'
import type { FocusSession } from '../types'

export function useSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, total] = await Promise.all([
        listSessions(40),
        totalFocusSeconds(startOfToday()),
      ])
      setSessions(rows)
      setTodaySeconds(total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { sessions, todaySeconds, loading, refresh }
}
