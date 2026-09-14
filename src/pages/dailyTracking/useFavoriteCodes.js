import { useCallback, useEffect, useRef, useState } from 'react'
import { getShellCache, setShellCache } from '../../data/offlineDb'

const CACHE_KEY = 'favoriteDelayCodes'
const DEVICE_SCOPE = '_device'
const MAX_FAVORITES = 5

export function useFavoriteCodes(operatorId, projectId) {
  const [byOperator, setByOperator] = useState({})
  const currentRef = useRef({})

  useEffect(() => {
    let cancelled = false
    getShellCache(CACHE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return
        currentRef.current = stored
        setByOperator(stored)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const scope = operatorId ?? DEVICE_SCOPE
  const favorites = (projectId && byOperator[scope]?.[projectId]) || []

  const toggle = useCallback((codeNum) => {
    if (!projectId) return
    const key = operatorId ?? DEVICE_SCOPE
    const all = currentRef.current
    const current = all[key]?.[projectId] ?? []
    const next = current.includes(codeNum)
      ? current.filter((c) => c !== codeNum)
      : [...current, codeNum].slice(-MAX_FAVORITES)
    const updated = { ...all, [key]: { ...(all[key] ?? {}), [projectId]: next } }
    currentRef.current = updated
    setByOperator(updated)
    setShellCache(CACHE_KEY, updated).catch(() => {})
  }, [operatorId, projectId])

  return { favorites, toggle }
}
