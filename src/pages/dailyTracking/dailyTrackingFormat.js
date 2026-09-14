import { COLORS, CATEGORY_COLORS } from '../../theme'

function effectiveWorkType(project, equipmentId) {
  const eq = project?.equipment?.find((e) => e.id === equipmentId)
  const pinned = (eq?.workType || '').trim()
  if (pinned) return pinned
  return (project?.workType || '').trim()
}

export function activeTileLabel(project, equipmentId) {
  const wt = effectiveWorkType(project, equipmentId).toLowerCase()
  return (wt.includes('cap') || wt.includes('placement')) ? 'ACTIVE PLACEMENT' : 'ACTIVE DREDGING'
}

export function activityLabel(activity, project, equipmentId) {
  return activity.active ? activeTileLabel(project, equipmentId) : activity.code
}

export function delayCategoryOf(activity) {
  return activity.active ? null : activity.category
}

export const STARTUP_SHUTDOWN_LABEL = 'STARTUP/SHUTDOWN'
export const STARTUP_SHUTDOWN_CATEGORY = 'Startup/Shutdown'

export function sessionColor(project, session) {
  if (session.delayCategory === STARTUP_SHUTDOWN_CATEGORY) return COLORS.startupShutdown
  return groupColor(project, session.delayCategory)
}

export function groupColor(project, category) {
  if (!category) return COLORS.secondaryGreen
  const cats = []
  project.delayCodes.forEach((c) => { if (!cats.includes(c.category)) cats.push(c.category) })
  const idx = cats.indexOf(category)
  return idx < 0 ? CATEGORY_COLORS[0] : CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
}

export function formatClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function formatDuration(ms) {
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function nowRoundedToFiveMin() {
  const d = new Date(Math.round(Date.now() / 300000) * 300000)
  return { hours: d.getHours(), minutes: d.getMinutes() }
}

export function hoursAndMinutesOf(date) {
  return { hours: date.getHours(), minutes: date.getMinutes() }
}

export function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatTimeOfDay(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}
