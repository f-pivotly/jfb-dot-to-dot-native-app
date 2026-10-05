import axios from 'axios'
import { requestNewToken, setAuthToken } from '../helpers/pivotlyHelpers'

const ENVIRONMENTS = {
  local: { apiPrefix: '', fallbackApiBaseUrl: 'https://dev.pivotly.com/vm/api/v3' },
  dev: { apiPrefix: '/vm', fallbackApiBaseUrl: 'https://dev.pivotly.com/vm/api/v3' },
  jfb: { fixedApiBaseUrl: 'https://app-jfbrennan-dev-core-api-cus-001.azurewebsites.net/vm/api/v3' },
}

const ENVIRONMENT = 'jfb'

const { apiPrefix = '', fallbackApiBaseUrl, fixedApiBaseUrl } = ENVIRONMENTS[ENVIRONMENT]
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || fixedApiBaseUrl || fallbackApiBaseUrl

function resolveApiBase() {
  if (fixedApiBaseUrl) {
    return fixedApiBaseUrl
  }

  const runtimeConfig = window.__PIVOTLY_RUNTIME_CONFIG__;
  if (!runtimeConfig?.apiBaseUrl) {
    return DEFAULT_API_BASE_URL
  }

  let parentOrigin
  try {
    parentOrigin = window.parent.location.origin
  } catch {
    parentOrigin = ''
  }
  if (!parentOrigin && document.referrer) {
    try {
      parentOrigin = new URL(document.referrer).origin
    } catch {
      parentOrigin = ''
    }
  }

  if (!parentOrigin) {
    return DEFAULT_API_BASE_URL
  }

  return parentOrigin + apiPrefix + runtimeConfig.apiBaseUrl
}

export const API_BASE_URL = resolveApiBase()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})


export const applyAuthToken = (token) => setAuthToken(api, token)

export const applyAppSlug = (appSlug) => {
  if (appSlug) {
    api.defaults.headers.common['x-app-slug'] = appSlug
  } else {
    delete api.defaults.headers.common['x-app-slug']
  }
}

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const newToken = await requestNewToken(api)
        original.headers['Authorization'] = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export async function fetchAppResolve(appSlug) {
  const { data } = await api.get(`/native-apps/${appSlug}/resolve`)
  return data?.data
}

export async function fetchPageDetails(appSlug, pageSlug) {
  const { data } = await api.get(`/native-apps/${appSlug}/pages/${pageSlug}/resolve`)
  return data
}
function asRowArray(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  for (const key of ['data', 'rows', 'values', 'items', 'result']) {
    const nested = asRowArray(payload[key])
    if (nested.length) return nested
  }
  return []
}

export async function fetchPicklistValues(slug) {
  const { data } = await api.get(`/picklists/${slug}/values`)
  return asRowArray(data)
}

export async function fetchDomainRecords({
  domain, system, appSlug, limit = 25, offset = 0, filters, sortCol, sortDir, countMode,
}) {
  const { data } = await api.post('/core-data-read', {
    parameters: {
      domain,
      system,
      app_slug: appSlug,
      limit,
      offset,
      ...(filters ? { filters } : {}),
      ...(sortCol ? { sort_col: sortCol, sort_dir: sortDir ?? 'asc' } : {}),
      ...(countMode ? { count_mode: countMode } : {}),
    },
  })
  return data
}

const READ_ALL_PAGE_SIZE = 1000

function hasEmptyInFilter(filters) {
  return Object.values(filters ?? {}).some((v) => Array.isArray(v) && v.length === 0)
}

export async function fetchAllDomainRecords({ domain, system, appSlug, filters, pageSize = READ_ALL_PAGE_SIZE }) {
  if (hasEmptyInFilter(filters)) return []
  const all = []
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetchDomainRecords({ domain, system, appSlug, filters, limit: pageSize, offset, countMode: 'none' })
    const rows = Array.isArray(res) ? res : (res?.data ?? [])
    all.push(...rows)
    if (rows.length < pageSize || res?.meta?.has_more === false) return all
  }
}

export async function createDomainRecord({ domain, system, appSlug, recordData }) {
  const { data } = await api.post('/core-data-write', {
    parameters: {
      domain,
      system,
      operation: 'insert',
      latency: 'synchronous',
      app_slug: appSlug,
    },
    data: recordData,
  })
  return data
}
