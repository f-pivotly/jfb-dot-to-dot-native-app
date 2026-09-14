import { useCallback, useEffect, useRef, useState } from 'react'
import { getShellCache, setShellCache } from '../../data/offlineDb'
import { localDateKey } from './dailyTrackingFormat'

const CACHE_KEY = 'lastUsedSelection'

export const SELECTION_TTL_MS = 345600000

function bootFlags(stored) {
  if (!stored) return { fresh: false, openShiftToday: false }
  return {
    fresh: Boolean(stored.savedAt) && Date.now() - stored.savedAt < SELECTION_TTL_MS,
    openShiftToday: Boolean(stored.shiftStartISO) && stored.shiftDate === localDateKey(),
  }
}

export function useLastUsedSelection() {
  const [lastUsed, setLastUsed] = useState(null)
  const [ready, setReady] = useState(false)
  const [flags, setFlags] = useState({ fresh: false, openShiftToday: false })
  const currentRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getShellCache(CACHE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return
        currentRef.current = stored
        setLastUsed(stored)
        setFlags(bootFlags(stored))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

  const remember = useCallback((patch) => {
    const next = { ...(currentRef.current ?? {}), ...patch, savedAt: Date.now() }
    currentRef.current = next
    setLastUsed(next)
    setFlags(bootFlags(next))
    setShellCache(CACHE_KEY, next).catch(() => {})
  }, [])

  return { lastUsed, ready, fresh: flags.fresh, openShiftToday: flags.openShiftToday, remember }
}
