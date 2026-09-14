import { useState, useCallback, useEffect } from 'react'
import { getAllQueueItems, deleteQueueItem } from '../../data/offlineDb'
import { notifySuccess } from './notify'

export function useOfflineSyncQueue({ createDailyActivity }) {
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [pendingItems, setPendingItems] = useState([])

  const drainQueue = useCallback(async () => {
    const items = await getAllQueueItems().catch(() => [])
    const ours = items.filter((item) => item.domain === 'jfb_daily_activities')
    setPendingItems(ours)
    setPendingSyncCount(ours.length)
    if (!navigator.onLine || !createDailyActivity) return
    let drained = 0
    for (const item of ours) {
      try {
        await createDailyActivity(item.recordData)
        await deleteQueueItem(item.local_id)
        drained += 1
        setPendingItems((prev) => prev.filter((i) => i.local_id !== item.local_id))
        setPendingSyncCount((n) => Math.max(0, n - 1))
      } catch {
        continue
      }
    }
    if (drained > 0) {
      notifySuccess(`${drained} session${drained === 1 ? '' : 's'} synced`)
    }
  }, [createDailyActivity])

  useEffect(() => {
    const kickoffId = setTimeout(drainQueue, 0)
    const intervalId = setInterval(drainQueue, 30000)
    window.addEventListener('online', drainQueue)
    return () => {
      clearTimeout(kickoffId)
      clearInterval(intervalId)
      window.removeEventListener('online', drainQueue)
    }
  }, [drainQueue])

  return { pendingSyncCount, pendingItems, drainQueue }
}
