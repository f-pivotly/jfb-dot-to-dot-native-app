import { useEffect, useState, useRef } from 'react'
import { loadPicklist } from './usePicklist'

export function usePicklistCatalog(slugs, { enabled = true } = {}) {
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState([])
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (!enabled) return undefined
    cancelledRef.current = false
    if (!cancelledRef.current) setLoading(true)

    Promise.allSettled(slugs.map((slug) => loadPicklist(slug))).then((results) => {
      if (cancelledRef.current) return
      const failed = results
        .map((result, i) => (result.status === 'rejected' ? slugs[i] : null))
        .filter(Boolean)
      setMissing(failed)
      setLoading(false)
    })

    return () => { cancelledRef.current = true }
  }, [slugs, enabled])

  return { loading, missing }
}
