import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Nota: el index 'by-synced' usa 0/1 en vez de boolean porque IndexedDB
// no admite boolean como IDBValidKey (límite del estándar Web).
interface SkyOpsDB extends DBSchema {
  pending_actions: {
    key: number
    value: {
      id?: number
      action_type: string
      payload: object
      client_timestamp: string
      synced: 0 | 1
    }
    indexes: { 'by-synced': number }
  }
}

let db: IDBPDatabase<SkyOpsDB> | null = null

export async function getDB() {
  if (!db) {
    db = await openDB<SkyOpsDB>('skyops-offline', 1, {
      upgrade(database) {
        const store = database.createObjectStore('pending_actions', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('by-synced', 'synced')
      },
    })
  }
  return db
}

export async function addPendingAction(action_type: string, payload: object) {
  const database = await getDB()
  return database.add('pending_actions', {
    action_type,
    payload,
    client_timestamp: new Date().toISOString(),
    synced: 0,
  })
}

export async function getPendingActions() {
  const database = await getDB()
  return database.getAllFromIndex('pending_actions', 'by-synced', 0)
}

export async function markActionSynced(id: number) {
  const database = await getDB()
  const action = await database.get('pending_actions', id)
  if (action) {
    action.synced = 1
    await database.put('pending_actions', action)
  }
}
