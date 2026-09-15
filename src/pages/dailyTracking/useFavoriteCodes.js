import { useCallback, useEffect, useRef, useState } from 'react'
import { getShellCache, setShellCache } from '../../data/offlineDb'
import { notifyWarning } from './notify'

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
    const removing = current.includes(codeNum)
    if (!removing && current.length >= MAX_FAVORITES) {
      notifyWarning(`You can pin up to ${MAX_FAVORITES} favourites`, 'Unpin one to make room.')
      return
    }
    const next = removing
      ? current.filter((c) => c !== codeNum)
      : [...current, codeNum]
    const updated = { ...all, [key]: { ...(all[key] ?? {}), [projectId]: next } }
    currentRef.current = updated
    setByOperator(updated)
    setShellCache(CACHE_KEY, updated).catch(() => {})
  }, [operatorId, projectId])

  return { favorites, toggle }
}
