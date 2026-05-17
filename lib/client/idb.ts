import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface SkyOpsDB extends DBSchema {
  pending_actions: {
    key: number
    value: {
      id?: number
      action_type: string
      payload: object
      client_timestamp: string
      synced: boolean
    }
    indexes: { 'by-synced': boolean }
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
    synced: false,
  })
}

export async function getPendingActions() {
  const database = await getDB()
  return database.getAllFromIndex('pending_actions', 'by-synced', false)
}

export async function markActionSynced(id: number) {
  const database = await getDB()
  const action = await database.get('pending_actions', id)
  if (action) {
    action.synced = true
    await database.put('pending_actions', action)
  }
}
