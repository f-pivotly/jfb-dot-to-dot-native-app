const RECOVERY_KEY = 'dtd_active_session_v1'

export function readRecovery() {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(RECOVERY_KEY)
    return null
  }
}

export function writeRecovery(snapshot) {
  localStorage.setItem(RECOVERY_KEY, JSON.stringify(snapshot))
}

export function clearRecovery() {
  localStorage.removeItem(RECOVERY_KEY)
}
