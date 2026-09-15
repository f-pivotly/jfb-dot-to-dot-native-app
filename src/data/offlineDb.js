const DB_NAME = 'jfb-dot-to-dot-data'
const VERSION = 2

const STORE_QUEUE = 'sync_queue'
const STORE_SHELL = 'app_shell_cache'
const STORE_CACHE = 'records_by_domain'
const STORE_SESSIONS = 'sessions'

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
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' })
        sessionStore.createIndex('date_idx', 'date')
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

export async function deleteQueueItemsForSession(sessionRowId) {
  if (!sessionRowId) return 0
  const db = await openDB()
  const items = await wrap(store(db, STORE_QUEUE, 'readonly').getAll())
  const matches = items.filter((item) => item.session_row_id === sessionRowId)
  if (!matches.length) return 0
  const tx = db.transaction(STORE_QUEUE, 'readwrite')
  const os = tx.objectStore(STORE_QUEUE)
  matches.forEach((item) => os.delete(item.local_id))
  await wrapTx(tx)
  return matches.length
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

export async function putSession(session) {
  if (!session?.id) return
  const db = await openDB()
  return wrap(store(db, STORE_SESSIONS, 'readwrite').put(session))
}

export async function getSessionsForDate(date) {
  if (!date) return []
  const db = await openDB()
  const idx = store(db, STORE_SESSIONS, 'readonly').index('date_idx')
  return wrap(idx.getAll(date))
}

export async function deleteStoredSession(id) {
  const db = await openDB()
  return wrap(store(db, STORE_SESSIONS, 'readwrite').delete(id))
}

export async function getCachedRecords(domain) {
  if (!domain) return []
  const db = await openDB()
  const idx = store(db, STORE_CACHE, 'readonly').index('domain_idx')
  const rows = await wrap(idx.getAll(domain))
  return rows.map((row) => row.record)
}
