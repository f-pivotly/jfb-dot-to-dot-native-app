import { COLORS, CATEGORY_COLORS } from '../../theme'

export function activeTileLabel(project) {
  return project.workType === 'capping' ? 'ACTIVE CAPPING' : 'ACTIVE DREDGING'
}

export function activityLabel(activity, project) {
  return activity.active ? activeTileLabel(project) : activity.code
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

export function formatTimeOfDay(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}
