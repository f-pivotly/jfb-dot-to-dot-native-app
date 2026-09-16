import { enqueueSync, getDeviceId } from '../../data/offlineDb'
import { notifyWarning, notifyError } from './notify'

export async function saveDailyActivity(createFn, {
  projectId, equipmentId, operatorId, sessionId, startTime, endTime,
  areaId, subAreaId, subSubAreaId, passType, layerId, delayCodeId, notes, category, sessionRowId,
  lane, step,
}) {
  const area = areaId || subAreaId || subSubAreaId
    ? {
        ...(areaId ? { area_id: areaId } : {}),
        ...(subAreaId ? { sub_area_id: subAreaId } : {}),
        ...(subSubAreaId ? { sub_sub_area_id: subSubAreaId } : {}),
      }
    : null
  const recordData = {
    local_id: sessionRowId ?? null,
    device_id: await getDeviceId().catch(() => null),
    project_id: projectId,
    equipment_id: equipmentId,
    operator_id: operatorId,
    session_id: sessionId,
    start_date_time: startTime.toISOString(),
    end_date_time: endTime.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    area,
    pass_type: passType || null,
    layer_id: layerId || null,
    lane: lane || null,
    step: step || null,
    delay_code_id: delayCodeId || null,
    notes: notes || null,
    category: category || null,
  }
  try {
    await createFn(recordData)
  } catch (err) {
    console.warn('daily_activities save failed, queued for retry:', err)
    try {
      await enqueueSync({
        local_id: crypto.randomUUID(),
        session_row_id: sessionRowId ?? null,
        domain: 'jfb_daily_activities',
        status: 'pending',
        attempts: 0,
        recordData,
        createdAt: Date.now(),
      })
      notifyWarning('Saved offline', 'This session will sync when the connection comes back.')
    } catch (queueErr) {
      console.warn('daily_activities queueing also failed (session kept on-screen only):', queueErr)
      notifyError('Session not saved', 'It is on this screen only. Leave the app open and tell your PM.')
    }
  }
}
