import { useDomainData } from './useDomainData'
import { useCachedDomainData } from './useCachedDomainData'

function findDomainSource(dataAccess, domain) {
  return (Array.isArray(dataAccess) ? dataAccess : []).find(
    (d) => d?.domain === domain && d?.source_type === 'domain',
  )
}

export function useCachedDomainSource(dataAccess, domain) {
  const source = findDomainSource(dataAccess, domain)
  return useCachedDomainData({ domain: source?.domain, system: source?.system })
}

export function useDomainSource(dataAccess, domain, { autoLoad = true } = {}) {
  const source = findDomainSource(dataAccess, domain)
  return useDomainData({ domain: source?.domain, system: source?.system, autoLoad })
}
