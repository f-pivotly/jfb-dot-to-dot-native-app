import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDomainRecords, createDomainRecord } from '../data'
import { useAppConfig } from '../contexts/pivotlyAppConfigContext'

export function useDomainData({ domain, system, autoLoad = true }) {
  const { config } = useAppConfig()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cancelledRef = useRef(false)

  const load = useCallback(() => {
    if (!domain || !system) return Promise.resolve()
    if (!cancelledRef.current) setLoading(true)
    if (!cancelledRef.current) setError(null)
    return fetchDomainRecords({ domain, system, appSlug: config.appSlug, limit: 1000 })
      .then((res) => {
        if (!cancelledRef.current) setRecords(Array.isArray(res) ? res : (res?.data ?? []))
      })
      .catch((err) => {
        if (!cancelledRef.current) setError(err.message)
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false)
      })
  }, [domain, system, config.appSlug])

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

  return { records, loading, error, create }
}
