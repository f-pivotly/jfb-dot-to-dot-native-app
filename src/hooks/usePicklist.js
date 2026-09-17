import { useEffect, useState, useRef } from 'react'
import { fetchPicklistValues } from '../data'
import { getShellCache, setShellCache } from '../data/offlineDb'

const inflight = new Map()

const picklistCacheKey = (slug) => `picklist:${slug}`

export function loadPicklist(slug) {
  if (!inflight.has(slug)) {
    inflight.set(
      slug,
      fetchPicklistValues(slug)
        .then((rows) => {
          if (Array.isArray(rows)) setShellCache(picklistCacheKey(slug), rows).catch(() => {})
          return rows
        })
        .catch(async (err) => {
          const cached = await getShellCache(picklistCacheKey(slug)).catch(() => null)
          if (Array.isArray(cached) && cached.length) return cached
          inflight.delete(slug)
          throw err
        })
    )
  }
  return inflight.get(slug)
}

export function usePicklist(slug) {
  const [state, setState] = useState({ values: [], labels: {}, loading: true, error: null })
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!slug) return
    cancelledRef.current = false
    if (!cancelledRef.current) setState((s) => ({ ...s, loading: true, error: null }))

    loadPicklist(slug)
      .then((rows) => {
        if (cancelledRef.current) return
        const active = (rows || []).filter((r) => r.is_active !== false)
        setState({
          values: active.map((r) => r.value),
          labels: Object.fromEntries(active.map((r) => [r.value, r.label ?? r.value])),
          loading: false,
          error: null,
        })
      })
      .catch((err) => {
        if (cancelledRef.current) return
        setState({ values: [], labels: {}, loading: false, error: err.message })
      })

    return () => { cancelledRef.current = true }
  }, [slug])

  return state
}
