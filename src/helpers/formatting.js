export function findDomainSource(dataAccess, domain) {
  return (Array.isArray(dataAccess) ? dataAccess : []).find(
    (d) => d?.domain === domain && d?.source_type === 'domain',
  )
}
