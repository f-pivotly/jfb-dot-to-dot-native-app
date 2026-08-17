import { enqueueSync } from '../../../data/offlineDb'

export async function saveDailyActivity(createFn, {
  projectId, equipmentId, operatorId, sessionId, startTime, endTime,
}) {
  const recordData = {
    project_id: projectId,
    equipment_id: equipmentId,
    operator_id: operatorId,
    session_id: sessionId,
    start_date_time: startTime.toISOString(),
    end_date_time: endTime.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
