const DB_NAME = 'jfb-dot-to-dot-data'
const VERSION = 1

const STORE_QUEUE = 'sync_queue'
const STORE_SHELL = 'app_shell_cache'
const STORE_CACHE = 'records_by_domain'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'local_id' })
      }
      if (!db.objectStoreNames.contains(STORE_SHELL)) {
        db.createObjectStore(STORE_SHELL, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        const cacheStore = db.createObjectStore(STORE_CACHE, { keyPath: 'cache_key' })
        cacheStore.createIndex('domain_idx', 'domain')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function store(db, name, mode) {
  return db.transaction(name, mode).objectStore(name)
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function wrapTx(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function enqueueSync(item) {
  const db = await openDB()
  return wrap(store(db, STORE_QUEUE, 'readwrite').put(item))
}

export async function getAllQueueItems() {
  const db = await openDB()
  return wrap(store(db, STORE_QUEUE, 'readonly').getAll())
}

export async function deleteQueueItem(localId) {
  const db = await openDB()
  return wrap(store(db, STORE_QUEUE, 'readwrite').delete(localId))
}

export async function setShellCache(key, value) {
  const db = await openDB()
  return wrap(store(db, STORE_SHELL, 'readwrite').put({ key, value }))
}

export async function getShellCache(key) {
  const db = await openDB()
  const row = await wrap(store(db, STORE_SHELL, 'readonly').get(key))
  return row?.value
}

// ── Generic domain-keyed record cache ──────────────────────────────────────
// Used to fall back to the last-known-good list for a domain (projects,
// operators, equipment, areas, area levels, ...) when a live fetch fails --
// e.g. no network.

export async function cacheRecords(domain, records) {
  if (!domain || !Array.isArray(records)) return
  const db = await openDB()
  const tx = db.transaction(STORE_CACHE, 'readwrite')
  const os = tx.objectStore(STORE_CACHE)
  records.forEach((record) => {
    if (record?.id == null) return
    os.put({ cache_key: `${domain}::${record.id}`, domain, record })
  })
  return wrapTx(tx)
}

export async function getCachedRecords(domain) {
  if (!domain) return []
  const db = await openDB()
  const idx = store(db, STORE_CACHE, 'readonly').index('domain_idx')
  const rows = await wrap(idx.getAll(domain))
  return rows.map((row) => row.record)
}
