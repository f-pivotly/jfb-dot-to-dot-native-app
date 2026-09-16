import { COLORS, CATEGORY_COLORS } from '../../theme'

export const WORK_TYPES = {
  hydraulicDredging: 'Hydraulic Dredging',
  mechanicalDredging: 'Mechanical Dredging',
  hydraulicCapping: 'Hydraulic Capping',
  mechanicalCapping: 'Mechanical Capping',
}

const CAPPING = [WORK_TYPES.hydraulicCapping, WORK_TYPES.mechanicalCapping]

function normalizeWorkType(value) {
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function matches(workType, candidates) {
  const wt = normalizeWorkType(workType)
  return wt !== '' && candidates.some((c) => normalizeWorkType(c) === wt)
}

export function effectiveWorkType(project, equipmentId) {
  const eq = project?.equipment?.find((e) => e.id === equipmentId)
  const pinned = (eq?.workType || '').trim()
  if (pinned) return pinned
  return (project?.workType || '').trim()
}

export function isCappingWork(project, equipmentId) {
  return matches(effectiveWorkType(project, equipmentId), CAPPING)
}

export function usesLaneStep(project, equipmentId) {
  return matches(effectiveWorkType(project, equipmentId), [WORK_TYPES.hydraulicCapping])
}

export function activeTileLabel(project, equipmentId) {
  return isCappingWork(project, equipmentId) ? 'ACTIVE PLACEMENT' : 'ACTIVE DREDGING'
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

export function dateKeyOf(session) {
  return session.date ?? localDateKey(session.startTime)
}

export function dayHeading(dateKey, today = new Date()) {
  const noon = new Date(`${dateKey}T12:00:00`)
  if (Number.isNaN(noon.getTime())) return dateKey

  const todayKey = localDateKey(today)
  const yesterdayKey = localDateKey(new Date(today.getTime() - 86400000))
  const short = noon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (dateKey === todayKey) return `Today · ${short}`
  if (dateKey === yesterdayKey) return `Yesterday · ${short}`
  return noon.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(noon.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  })
}

export function totalHoursOf(rows) {
  return rows.reduce((sum, s) => sum + s.durationMs, 0) / 3600000
}

export function groupSessionsByDate(sessions) {
  const buckets = new Map()
  sessions.forEach((s) => {
    const key = dateKeyOf(s)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(s)
  })
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, rows]) => ({ dateKey, rows, hours: totalHoursOf(rows) }))
}
