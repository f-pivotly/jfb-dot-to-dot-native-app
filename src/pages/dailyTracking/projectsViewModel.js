import { effectiveWorkType, isCappingWork } from './dailyTrackingFormat'

export function isMultiLayerProject(project, equipmentId) {
  return isCappingWork(project, equipmentId) && (project?.layers?.length ?? 0) > 1
}

export function passField(project, equipmentId, { passTypeOptions = [], liftOptions = [] } = {}) {
  if (isMultiLayerProject(project, equipmentId)) {
    return { label: 'Layer', options: (project.layers ?? []).map((l) => ({ value: l.id, label: l.layer_name })) }
  }
  if (isCappingWork(project, equipmentId)) return { label: 'Lift', options: liftOptions }
  return { label: 'Pass', options: passTypeOptions }
}

export function visibleDelayCodes(project, equipmentId, workTypeNameById) {
  const codes = project?.delayCodes ?? []
  const wt = effectiveWorkType(project, equipmentId).toLowerCase()
  if (!wt || !workTypeNameById?.size) return codes
  return codes.filter((c) => {
    if (!c.workTypeId) return true
    const name = workTypeNameById.get(c.workTypeId)
    return !name || name.toLowerCase() === wt
  })
}

export function resolvePass(project, equipmentId, value, options = []) {
  const isMulti = isMultiLayerProject(project, equipmentId)
  return {
    pass: options.find((o) => o.value === value)?.label ?? '',
    passType: isMulti ? null : (value || null),
    layerId: isMulti ? (value || null) : null,
  }
}

export function buildProjects({
  projectRecords, operatorRecords, projectOperatorRecords = [], equipmentRecords, areaRecords, areaLevelRecords,
  layerRecords = [], projectDelayCodeRecords = [], masterDelayCodeRecords = [],
}) {
  const masterDelayCodeById = new Map(masterDelayCodeRecords.map((m) => [m.id, m]))
  const operatorById = new Map(operatorRecords.map((o) => [o.id, o]))

  return projectRecords.filter((p) => p.is_active !== false).map((p) => {
    const levels = areaLevelRecords.filter((l) => l.project_id === p.id)
    const level1 = levels.find((l) => l.depth === 1)
    const level2 = levels.find((l) => l.depth === 2)
    const level3 = levels.find((l) => l.depth === 3)
    const depthByLevelId = new Map(levels.map((l) => [l.id, l.depth]))
    const areasFlat = areaRecords
      .filter((a) => a.project_id === p.id && a.is_active !== false)
      .map((a) => ({
        id: a.id,
        name: a.name,
        parent_id: a.parent_id ?? null,
        depth: depthByLevelId.get(a.area_level_id) ?? null,
        sort_order: a.sort_order ?? 0,
      }))
      .sort((a, b) => a.sort_order - b.sort_order)

    const layers = layerRecords
      .filter((l) => l.project_id === p.id && l.active !== false)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const delayCodes = projectDelayCodeRecords
      .filter((r) => r.project_id === p.id && r.active !== false)
      .map((r) => {
        const master = r.delay_code_id ? masterDelayCodeById.get(r.delay_code_id) : null
        return {
          id: r.id,
          category: master ? master.category : r.category,
          code: master ? master.code : r.code,
          codeNum: master ? master.code_num : r.code_num,
          sortOrder: r.sort_order ?? master?.sort_order ?? 0,
          workTypeId: master ? (master.work_type_id ?? null) : (r.work_type_id ?? null),
        }
      })
      .sort((a, b) =>
        (a.category ?? '').localeCompare(b.category ?? '') || a.sortOrder - b.sortOrder,
      )

    return {
      id: p.id,
      name: p.name,
      client: p.client_name ?? null,
      equipment: equipmentRecords.filter((e) => e.project_id === p.id && e.is_active !== false).map((e) => ({
        id: e.id,
        name: e.name,
        workType: e.work_type ?? null,
      })),
      operators: projectOperatorRecords
        .filter((r) => r.project_id === p.id && r.is_active !== false)
        .map((r) => operatorById.get(r.operator_id))
        .filter(Boolean)
        .map((o) => ({ id: o.id, name: o.name })),
      workType: p.work_type ?? null,
      ...(level1 ? { areaLabel: level1.label } : {}),
      ...(level2 ? { subAreaLabel: level2.label } : {}),
      ...(level3 ? { subSubAreaLabel: level3.label } : {}),
      delayCodes,
      layers,
      areasFlat,
    }
  })
}
