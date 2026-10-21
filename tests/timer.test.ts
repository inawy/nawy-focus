import { describe, expect, it } from 'vitest'
import {
  catchUp,
  createIdleState,
  pauseTimer,
  resumeTimer,
  setPlannedSeconds,
  startTimer,
  tick,
} from '../src/lib/timer'

describe('timer state machine', () => {
  it('starts from idle', () => {
    const idle = createIdleState('focus', 1500)
    expect(idle.phase).toBe('idle')
    expect(idle.remainingSeconds).toBe(1500)

    const running = startTimer(idle, 1_000)
    expect(running.phase).toBe('running')
    expect(running.startedAt).toBe(1_000)
  })

  it('ticks down and finishes', () => {
    let s = startTimer(createIdleState('focus', 3))
    s = tick(s, 1)
    expect(s.remainingSeconds).toBe(2)
    expect(s.elapsedSeconds).toBe(1)
    s = tick(s, 2)
    expect(s.phase).toBe('finished')
    expect(s.remainingSeconds).toBe(0)
    expect(s.elapsedSeconds).toBe(3)
  })

  it('ignores invalid or negative tick deltas', () => {
    const running = startTimer(createIdleState('focus', 30))
    expect(tick(running, -5)).toEqual(running)
    expect(tick(running, Number.NaN)).toEqual(running)
    expect(tick(running, Number.POSITIVE_INFINITY)).toEqual(running)
    expect(catchUp(running, Number.NaN)).toEqual(running)
  })

  it('pause and resume', () => {
    let s = startTimer(createIdleState('focus', 60))
    s = tick(s, 5)
    s = pauseTimer(s)
    expect(s.phase).toBe('paused')
    const frozen = s.remainingSeconds
    s = tick(s, 10)
    expect(s.remainingSeconds).toBe(frozen)
    s = resumeTimer(s)
    expect(s.phase).toBe('running')
  })

  it('does not change planned duration while active', () => {
    const s = startTimer(createIdleState('focus', 1500))
    expect(setPlannedSeconds(s, 600).plannedSeconds).toBe(1500)
  })

  it('catchUp advances by wall-clock seconds', () => {
    let s = startTimer(createIdleState('focus', 30))
    s = catchUp(s, 10)
    expect(s.remainingSeconds).toBe(20)
    expect(s.elapsedSeconds).toBe(10)
    s = catchUp(s, 25)
    expect(s.phase).toBe('finished')
    expect(s.remainingSeconds).toBe(0)
  })
})
