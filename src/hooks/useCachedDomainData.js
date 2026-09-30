import { useEffect, useState } from 'react'
import { useDomainData } from './useDomainData'
import { replaceCachedRecords, getCachedRecords } from '../data/offlineDb'

export function useCachedDomainData({ domain, system, filters, enabled = true }) {
  const { records, loading, error, loadedAt } = useDomainData({ domain, system, filters, enabled })
  const [cachedRecords, setCachedRecords] = useState([])

  useEffect(() => {
    if (!domain || loading || error || !loadedAt) return
    replaceCachedRecords(domain, records).catch(() => {})
  }, [domain, loading, error, loadedAt, records])

  useEffect(() => {
    if (!domain || loading || !error) return
    let cancelled = false
    getCachedRecords(domain).then((rows) => {
      if (!cancelled) setCachedRecords(rows)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [domain, loading, error])

  const offline = !loading && !!error
  return {
    records: offline ? cachedRecords : records,
    loading,
    error: offline ? null : error,
    offline,
  }
}
