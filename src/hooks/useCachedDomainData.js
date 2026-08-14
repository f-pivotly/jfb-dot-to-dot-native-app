import { useEffect, useState } from 'react'
import { useDomainData } from './useDomainData'
import { cacheRecords, getCachedRecords } from '../data/offlineDb'

export function useCachedDomainData({ domain, system }) {
  const { records, loading, error, reload } = useDomainData({ domain, system })
  const [cachedRecords, setCachedRecords] = useState([])

  useEffect(() => {
    if (!domain || loading) return
    if (!error) {
      cacheRecords(domain, records).catch(() => {})
      return
    }
    let cancelled = false
    getCachedRecords(domain).then((rows) => {
      if (!cancelled) setCachedRecords(rows)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [domain, loading, error, records])

  const offline = !loading && !!error
  return {
    records: offline ? cachedRecords : records,
    loading,
    error: offline ? null : error,
    offline,
    reload,
  }
}
