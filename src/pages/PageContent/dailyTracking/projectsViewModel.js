import { getProjectExtras } from './dailyTrackingSampleData'

export function buildProjects({ projectRecords, operatorRecords, equipmentRecords, areaRecords, areaLevelRecords }) {
  return projectRecords.map((p) => {
    const extras = getProjectExtras(p.name)

    const levels = areaLevelRecords.filter((l) => l.project_id === p.id)
    const level1 = levels.find((l) => l.depth === 1)
    const level2 = levels.find((l) => l.depth === 2)
    const level3 = levels.find((l) => l.depth === 3)
    const depthByLevelId = new Map(levels.map((l) => [l.id, l.depth]))
    const areasFlat = areaRecords
      .filter((a) => a.project_id === p.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        parent_id: a.parent_id ?? null,
        depth: depthByLevelId.get(a.area_level_id) ?? null,
        sort_order: a.sort_order ?? 0,
      }))
      .sort((a, b) => a.sort_order - b.sort_order)
    const level1AreaNames = areasFlat.filter((a) => a.depth === 1).map((a) => a.name)

    return {
      id: p.id,
      name: p.name,
      equipment: equipmentRecords.filter((e) => e.project_id === p.id).map((e) => ({ id: e.id, name: e.name })),
      operators: operatorRecords.filter((o) => o.project_id === p.id).map((o) => ({ id: o.id, name: o.name })),
      ...extras,
      ...(level1 ? { areaLabel: level1.label } : {}),
      ...(level2 ? { subAreaLabel: level2.label } : {}),
      ...(level3 ? { subSubAreaLabel: level3.label } : {}),
      ...(level1AreaNames.length ? { areas: level1AreaNames } : {}),
      areasFlat,
    }
  })
}
