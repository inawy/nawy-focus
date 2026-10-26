import { describe, expect, it } from 'vitest'
import { createIdleState, pauseTimer, startTimer, tick } from '../src/lib/timer'
import { recoverTimerSnapshot } from '../src/lib/timerRecovery'
import type { TimerState } from '../src/types'

function snapshot(state: TimerState, savedAt: number): string {
  return JSON.stringify({ version: 1, savedAt, state })
}

describe('timer recovery', () => {
  it('catches up a running session after refresh', () => {
    const running = tick(startTimer(createIdleState('focus', 600), 1_000), 120)
    const restored = recoverTimerSnapshot(snapshot(running, 10_000), 70_000)
    expect(restored?.phase).toBe('running')
    expect(restored?.remainingSeconds).toBe(420)
    expect(restored?.elapsedSeconds).toBe(180)
    expect(restored?.startedAt).toBe(1_000)
  })

  it('restores a paused session without counting closed time', () => {
    const paused = pauseTimer(tick(startTimer(createIdleState('focus', 600), 1_000), 120))
    const restored = recoverTimerSnapshot(snapshot(paused, 10_000), 500_000)
    expect(restored).toEqual(paused)
  })

  it('marks a running session finished if its remaining time elapsed', () => {
    const running = tick(startTimer(createIdleState('break', 60), 1_000), 10)
    const restored = recoverTimerSnapshot(snapshot(running, 10_000), 100_000)
    expect(restored?.phase).toBe('finished')
    expect(restored?.remainingSeconds).toBe(0)
    expect(restored?.elapsedSeconds).toBe(60)
  })

  it('does not count negative wall-clock differences', () => {
    const running = startTimer(createIdleState('focus', 600), 1_000)
    expect(recoverTimerSnapshot(snapshot(running, 20_000), 10_000)).toEqual(running)
  })

  it('rejects fractional and unsafe integer fields in recovery snapshots', () => {
    const running = startTimer(createIdleState('focus', 600), 1_000)
    const valid = { version: 1, savedAt: 10_000, state: running }

    expect(recoverTimerSnapshot(JSON.stringify({ ...valid, savedAt: 10_000.5 }), 10_000)).toBeNull()
    expect(recoverTimerSnapshot(JSON.stringify({
      ...valid,
      state: { ...running, remainingSeconds: running.remainingSeconds - 0.5 },
    }), 10_000)).toBeNull()
    expect(recoverTimerSnapshot(JSON.stringify({
      ...valid,
      state: { ...running, startedAt: 1_000.5 },
    }), 10_000)).toBeNull()
    expect(recoverTimerSnapshot(JSON.stringify({
      ...valid,
      state: { ...running, plannedSeconds: Number.MAX_SAFE_INTEGER + 1 },
    }), 10_000)).toBeNull()
  })

  it('rejects malformed, unsupported, and inconsistent snapshots', () => {
    expect(recoverTimerSnapshot('{')).toBeNull()
    expect(recoverTimerSnapshot(null)).toBeNull()
    expect(recoverTimerSnapshot(JSON.stringify({ version: 2, savedAt: 1, state: {} }))).toBeNull()
    const inconsistent = { ...startTimer(createIdleState('focus', 600)), remainingSeconds: 100 }
    expect(recoverTimerSnapshot(snapshot(inconsistent, 10_000), 10_000)).toBeNull()
  })
})
