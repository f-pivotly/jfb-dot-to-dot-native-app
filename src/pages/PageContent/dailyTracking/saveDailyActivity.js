import { enqueueSync } from '../../../data/offlineDb'

export async function saveDailyActivity(createFn, {
  projectId, equipmentId, operatorId, sessionId, startTime, endTime,
  areaId, subAreaId, subSubAreaId, passType, delayCodeId, notes,
}) {
  const area = areaId || subAreaId || subSubAreaId
    ? {
        ...(areaId ? { area_id: areaId } : {}),
        ...(subAreaId ? { sub_area_id: subAreaId } : {}),
        ...(subSubAreaId ? { sub_sub_area_id: subSubAreaId } : {}),
      }
    : null
  const recordData = {
    project_id: projectId,
    equipment_id: equipmentId,
    operator_id: operatorId,
    session_id: sessionId,
    start_date_time: startTime.toISOString(),
    end_date_time: endTime.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    area,
    pass_type: passType || null,
    delay_code_id: delayCodeId || null,
    notes: notes || null,
  }
  try {
    await createFn(recordData)
  } catch (err) {
    console.warn('daily_activities save failed, queued for retry:', err)
    await enqueueSync({
      local_id: crypto.randomUUID(),
      domain: 'jfb_daily_activities',
      operation: 'create',
      recordData,
      createdAt: Date.now(),
    }).catch((queueErr) => {
      console.warn('daily_activities queueing also failed (session kept on-screen only):', queueErr)
    })
  }
}
