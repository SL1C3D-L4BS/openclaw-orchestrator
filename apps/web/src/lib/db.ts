/**
 * Local SQLite (WASM via sql.js) for offline-first crisis workflows.
 * Client-only: use only in browser. Persists to IndexedDB (no localStorage).
 */

const TABLE_NAME = "crisis_workflows";
const IDB_KEY = "openclaw-crisis-db";
const IDB_NAME = "openclaw-crisis";

export type SyncStatus = "synced" | "pending_update";

export interface CrisisWorkflowRow {
  id: string;
  version: number;
  workflow_json: string;
  status: string;
  created_at: string;
  sync_status: SyncStatus;
}

interface SqlJsDatabase {
  run(sql: string, params?: Record<string, unknown>): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  export(): Uint8Array;
}

let db: SqlJsDatabase | null = null;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function loadFromIdb(): Promise<Uint8Array | null> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction("default", "readonly");
    const store = tx.objectStore("default");
    const req = store.get(IDB_KEY);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result ?? null);
    idb.close();
  });
}

async function saveToIdb(data: Uint8Array): Promise<void> {
  const idb = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction("default", "readwrite");
    const store = tx.objectStore("default");
    store.put(data, IDB_KEY);
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    idb.close();
  });
}

async function ensureIdbStore(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      (req.result as IDBDatabase).createObjectStore("default");
    };
    req.onsuccess = () => {
      (req.result as IDBDatabase).close();
      resolve();
    };
  });
}

/**
 * Runs the schema migration: creates crisis_workflows table if it does not exist.
 * Schema matches Go backend: id, version, workflow_json, status, created_at;
 * plus local-only sync_status.
 */
function runMigration(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT NOT NULL PRIMARY KEY,
      version INTEGER NOT NULL,
      workflow_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'synced'
    )
  `);
}

/**
 * Returns the singleton local DB. Initializes sql.js, loads from IndexedDB or creates new, runs migration.
 * Must be called from the browser only.
 */
export async function getDb(): Promise<SqlJsDatabase> {
  if (typeof window === "undefined") {
    throw new Error("Local DB is only available in the browser.");
  }
  if (db) return db;
  await ensureIdbStore();
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs({
    locateFile: (file) => (file.endsWith(".wasm") ? "/sql-wasm.wasm" : file),
  });
  const persisted = await loadFromIdb();
  if (persisted && persisted.length > 0) {
    db = new SQL.Database(persisted);
  } else {
    db = new SQL.Database();
    runMigration(db);
  }
  return db;
}

function persistDb(): void {
  if (db) {
    const data = db.export();
    saveToIdb(data).catch(console.error);
  }
}

/**
 * Fetches all rows from the local crisis_workflows table.
 */
export async function getWorkflowsFromLocalDb(): Promise<CrisisWorkflowRow[]> {
  const database = await getDb();
  const result = database.exec(
    `SELECT id, version, workflow_json, status, created_at, sync_status FROM ${TABLE_NAME} ORDER BY created_at DESC`
  );
  if (!result.length || !result[0].values.length) return [];
  const columns = result[0].columns;
  const col = (name: string) => columns.indexOf(name);
  return result[0].values.map((row) => ({
    id: row[col("id")] as string,
    version: row[col("version")] as number,
    workflow_json: row[col("workflow_json")] as string,
    status: row[col("status")] as string,
    created_at: row[col("created_at")] as string,
    sync_status: ((row[col("sync_status")] as string) || "synced") as SyncStatus,
  }));
}

/**
 * Upserts a workflow into the local DB. If id exists and server version > local version,
 * overwrites and sets sync_status to 'synced'.
 */
export async function upsertWorkflow(
  row: Omit<CrisisWorkflowRow, "sync_status">,
  syncStatus: SyncStatus = "synced"
): Promise<void> {
  const database = await getDb();
  database.run(
    `INSERT INTO ${TABLE_NAME} (id, version, workflow_json, status, created_at, sync_status) VALUES (:id, :version, :workflow_json, :status, :created_at, :sync_status)
     ON CONFLICT(id) DO UPDATE SET
       version = excluded.version,
       workflow_json = excluded.workflow_json,
       status = excluded.status,
       created_at = excluded.created_at,
       sync_status = excluded.sync_status`,
    {
      ":id": row.id,
      ":version": row.version,
      ":workflow_json": row.workflow_json,
      ":status": row.status,
      ":created_at": row.created_at,
      ":sync_status": syncStatus,
    }
  );
  persistDb();
}
