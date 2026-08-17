import { useState } from 'react'
import { readRecovery, clearRecovery } from './recoverySession'

export function useCrashRecovery(projects) {
  const [recovery] = useState(readRecovery)
  const recoveredProject = recovery ? projects.find((p) => p.id === recovery.projectId) : null
  const [recoveryData, setRecoveryData] = useState(recovery)
  const [recoveryEndTime, setRecoveryEndTime] = useState(() => {
    const rounded = new Date(Math.round(Date.now() / 300000) * 300000)
    return { hours: rounded.getHours(), minutes: rounded.getMinutes() }
  })

  function buildRecoveredSession() {
    const start = new Date(recoveryData.startTimeISO)
    const end = new Date(start)
    end.setHours(recoveryEndTime.hours, recoveryEndTime.minutes, 0, 0)
    if (end <= start) end.setDate(end.getDate() + 1)
    return { start, end }
  }

  function clear() {
    clearRecovery()
    setRecoveryData(null)
  }

  return {
    recovery,
    recoveredProject,
    recoveryData,
    recoveryEndTime,
    setRecoveryEndTime,
    buildRecoveredSession,
    clear,
  }
}
