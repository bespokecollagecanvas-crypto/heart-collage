// Tiny IndexedDB wrapper used by demo mode to keep photos on the phone.
const DB = 'days-demo'
let dbp

function open() {
  if (!dbp)
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        db.createObjectStore('kv')
        const s = db.createObjectStore('captures', { keyPath: 'id' })
        s.createIndex('day', 'day')
        db.createObjectStore('blobs')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  return dbp
}

async function tx(store, mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const out = fn(t.objectStore(store))
    t.oncomplete = () => resolve(out instanceof IDBRequest ? out.result : out)
    t.onerror = () => reject(t.error)
  })
}

export const idb = {
  get: (store, key) => tx(store, 'readonly', (s) => s.get(key)),
  put: (store, value, key) => tx(store, 'readwrite', (s) => s.put(value, key)),
  del: (store, key) => tx(store, 'readwrite', (s) => s.delete(key)),
  rangeByDay: (from, to) => tx('captures', 'readonly', (s) => s.index('day').getAll(IDBKeyRange.bound(from, to))),
}
