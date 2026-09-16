import { useState, useCallback, useEffect } from 'react'
import {
  getAllQueueItems, deleteQueueItem, deleteQueueItemsForSession,
  markQueueItemFailed, retryFailedQueueItems,
} from '../../data/offlineDb'
import { notifySuccess, notifyInfo } from './notify'

const DOMAIN = 'jfb_daily_activities'

function alreadyLanded(err, status) {
  if (status === 409) return true
  let body
  try {
    body = JSON.stringify(err?.response?.data ?? '')
  } catch {
    body = String(err?.message ?? '')
  }
  return /23505|duplicate key|already exists|unique constraint/i.test(body)
}

export function classifyWriteError(err) {
  const status = err?.response?.status
  if (alreadyLanded(err, status)) return 'landed'
  if (!status || status >= 500) return 'transient'
  if (status >= 400) return 'terminal'
  return 'transient'
}

function reasonFor(err) {
  const status = err?.response?.status
  const detail = err?.response?.data?.message || err?.response?.data?.error || err?.message
  return [status ? `HTTP ${status}` : null, detail].filter(Boolean).join(' — ').slice(0, 200)
}

export function useOfflineSyncQueue({ createDailyActivity }) {
  const [pendingItems, setPendingItems] = useState([])
  const [failedItems, setFailedItems] = useState([])

  const readQueue = useCallback(async () => {
    const items = (await getAllQueueItems().catch(() => [])).filter((i) => i.domain === DOMAIN)
    const pending = items.filter((i) => i.status !== 'failed')
    const failed = items.filter((i) => i.status === 'failed')
    setPendingItems(pending)
    setFailedItems(failed)
    return pending
  }, [])

  const drainQueue = useCallback(async () => {
    const pending = await readQueue()
    if (!navigator.onLine || !createDailyActivity || !pending.length) return
    let drained = 0
    for (const item of pending) {
      try {
        await createDailyActivity(item.recordData)
        await deleteQueueItem(item.local_id)
        drained += 1
      } catch (err) {
        const verdict = classifyWriteError(err)
        if (verdict === 'landed') {
          await deleteQueueItem(item.local_id)
          drained += 1
        } else if (verdict === 'terminal') {
          await markQueueItemFailed(item.local_id, reasonFor(err))
        }
      }
    }
    await readQueue()
    if (drained > 0) {
      notifySuccess(`${drained} session${drained === 1 ? '' : 's'} synced`)
    }
  }, [createDailyActivity, readQueue])

  const retryFailed = useCallback(async () => {
    const moved = await retryFailedQueueItems().catch(() => 0)
    if (moved > 0) notifyInfo(`${moved} session${moved === 1 ? '' : 's'} queued again`)
    await drainQueue()
  }, [drainQueue])

  const dropSessionFromQueue = useCallback(async (sessionRowId) => {
    const dropped = await deleteQueueItemsForSession(sessionRowId).catch(() => 0)
    if (dropped > 0) await readQueue()
    return dropped
  }, [readQueue])

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

  return {
    pendingItems,
    failedItems,
    pendingSyncCount: pendingItems.length,
    failedSyncCount: failedItems.length,
    drainQueue,
    retryFailed,
    dropSessionFromQueue,
  }
}
