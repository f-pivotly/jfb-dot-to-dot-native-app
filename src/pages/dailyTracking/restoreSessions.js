import { localDateKey, STARTUP_SHUTDOWN_CATEGORY, STARTUP_SHUTDOWN_LABEL } from './dailyTrackingFormat'

export const RESTORE_SORT_COL = 'start_date_time'

export function restoreFilters(projectId, equipmentId) {
  return {
    ...(projectId ? { project_id: projectId } : {}),
    ...(equipmentId ? { equipment_id: equipmentId } : {}),
  }
}

function labelFrom(list, id, key) {
  if (!id) return ''
  return list.find((item) => item.id === id)?.[key] ?? ''
}

function passLabelFor(row, project, passOptions) {
  if (row.layer_id) return labelFrom(project?.layers ?? [], row.layer_id, 'layer_name')
  if (!row.pass_type) return ''
  return passOptions.find((o) => o.value === row.pass_type)?.label ?? row.pass_type
}

function delayCategoryFor(row, project) {
  if (row.category === STARTUP_SHUTDOWN_LABEL) return STARTUP_SHUTDOWN_CATEGORY
  if (!row.delay_code_id) return null
  return (project?.delayCodes ?? []).find((c) => c.id === row.delay_code_id)?.category ?? null
}

export function toSessionRow(row, { project, passOptions = [] } = {}) {
  const startTime = new Date(row?.start_date_time)
  const endTime = new Date(row?.end_date_time)
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) return null
  if (endTime <= startTime) return null

  const id = row.local_id || row.id
  if (!id) return null

  const area = (row.area && typeof row.area === 'object') ? row.area : {}
  const areas = project?.areasFlat ?? []

  return {
    id,
    date: localDateKey(startTime),
    category: row.category ?? '',
    delayCategory: delayCategoryFor(row, project),
    startTime,
    endTime,
    durationMs: endTime - startTime,
    operatorName: labelFrom(project?.operators ?? [], row.operator_id, 'name'),
    areaL1: labelFrom(areas, area.area_id, 'name'),
    areaL2: labelFrom(areas, area.sub_area_id, 'name'),
    areaL3: labelFrom(areas, area.sub_sub_area_id, 'name'),
    pass: passLabelFor(row, project, passOptions),
    description: row.notes ?? '',
    lane: row.lane ?? '',
    step: row.step ?? '',
  }
}

export function toSessionRows(rows, context) {
  return (rows ?? []).map((row) => toSessionRow(row, context)).filter(Boolean)
}

export function mergeSessions(local, incoming) {
  const byId = new Map()
  incoming.forEach((s) => byId.set(s.id, s))
  local.forEach((s) => byId.set(s.id, s))
  const merged = [...byId.values()].sort((a, b) => b.startTime - a.startTime)
  const localIds = new Set(local.map((s) => s.id))
  return { merged, added: merged.filter((s) => !localIds.has(s.id)) }
}
