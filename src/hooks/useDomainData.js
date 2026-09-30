import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllDomainRecords, createDomainRecord } from '../data'
import { useAppConfig } from '../contexts/pivotlyAppConfigContext'

export function useDomainData({ domain, system, autoLoad = true, filters, enabled = true }) {
  const { config } = useAppConfig()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadedAt, setLoadedAt] = useState(0)
  const cancelledRef = useRef(false)
  const filtersKey = JSON.stringify(filters ?? null)

  const load = useCallback(() => {
    if (!domain || !system || !enabled) return Promise.resolve()
    if (!cancelledRef.current) setLoading(true)
    if (!cancelledRef.current) setError(null)
    return fetchAllDomainRecords({ domain, system, appSlug: config.appSlug, filters: JSON.parse(filtersKey) ?? undefined })
      .then((rows) => {
        if (!cancelledRef.current) {
          setRecords(rows)
          setLoadedAt(Date.now())
        }
      })
      .catch((err) => {
        if (!cancelledRef.current) setError(err.message)
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false)
      })
  }, [domain, system, config.appSlug, filtersKey, enabled])

  useEffect(() => {
    if (!autoLoad) return
    cancelledRef.current = false
    load()
    return () => { cancelledRef.current = true }
  }, [load, autoLoad])

  const create = useCallback(async (recordData) => {
    const res = await createDomainRecord({ domain, system, appSlug: config.appSlug, recordData })
    if (autoLoad) await load()
    return res
  }, [domain, system, config.appSlug, load, autoLoad])

  const query = useCallback(async ({ filters: queryFilters } = {}) => {
    if (!domain || !system) return []
    return fetchAllDomainRecords({ domain, system, appSlug: config.appSlug, filters: queryFilters })
  }, [domain, system, config.appSlug])

  return { records, loading, error, loadedAt, create, query }
}
