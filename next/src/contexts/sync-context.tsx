"use client";

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const DB_NAME = "ht-sync";
const DB_VERSION = 1;
const DRAFTS_STORE = "drafts";
const META_STORE = "meta";
const LAST_SYNC_KEY = "lastSyncAt";
const SYNC_STORAGE_EVENT = "ht:sync-storage";

export interface DraftItem {
  id: string;
  type: "biometric";
  studentId: string;
  payload: Record<string, unknown>;
  savedAt: string;
}

interface SyncSchema extends DBSchema {
  drafts: {
    key: string;
    value: DraftItem;
  };
  meta: {
    key: string;
    value: string;
  };
}

interface SyncContextValue {
  isOnline: boolean;
  draftCount: number;
  lastSyncAt: Date | null;
  isSyncing: boolean;
  addDraft: (item: Omit<DraftItem, "id" | "savedAt">) => Promise<void>;
  syncNow: () => Promise<void>;
}

const DEFAULT_VALUE: SyncContextValue = {
  isOnline: true,
  draftCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  addDraft: async () => {},
  syncNow: async () => {},
};

const SyncContext = createContext<SyncContextValue>(DEFAULT_VALUE);

let dbPromise: Promise<IDBPDatabase<SyncSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<SyncSchema>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB<SyncSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          db.createObjectStore(DRAFTS_STORE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      },
    });
  }
  return dbPromise;
}

function emitSyncStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SYNC_STORAGE_EVENT));
  }
}

async function getAllDrafts(): Promise<DraftItem[]> {
  try {
    const db = await getDb();
    return await db.getAll(DRAFTS_STORE);
  } catch {
    return [];
  }
}

async function putDraft(item: DraftItem): Promise<void> {
  const db = await getDb();
  await db.put(DRAFTS_STORE, item);
}

async function deleteDraft(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(DRAFTS_STORE, id);
}

async function clearDrafts(): Promise<void> {
  const db = await getDb();
  await db.clear(DRAFTS_STORE);
}

async function readLastSync(): Promise<string | null> {
  try {
    const db = await getDb();
    return (await db.get(META_STORE, LAST_SYNC_KEY)) ?? null;
  } catch {
    return null;
  }
}

async function writeLastSync(iso: string): Promise<void> {
  const db = await getDb();
  await db.put(META_STORE, iso, LAST_SYNC_KEY);
}

function parseLastSync(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function subscribeOnline(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function subscribeSyncStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SYNC_STORAGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SYNC_STORAGE_EVENT, onStoreChange);
  };
}

function readOnlineSnapshot() {
  return navigator.onLine;
}

function readDraftCountSnapshot() {
  // External store: live value comes from the DB; for the initial
  // server-rendered snapshot we report 0 and re-hydrate on mount.
  return 0;
}

function readLastSyncSnapshot() {
  return null;
}

const SYNC_CONCURRENCY = 4;

async function postDraft(item: DraftItem): Promise<boolean> {
  try {
    const res = await fetch(`/api/students/${item.studentId}/biometrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item.payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;

  async function next() {
    const index = cursor++;
    if (index >= items.length) return;
    results[index] = await worker(items[index]!);
    return next();
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => next(),
  );
  await Promise.all(workers);
  return results;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    readOnlineSnapshot,
    () => true,
  );
  const draftCountExternal = useSyncExternalStore(
    subscribeSyncStorage,
    readDraftCountSnapshot,
    () => 0,
  );
  const lastSyncValueExternal = useSyncExternalStore(
    subscribeSyncStorage,
    readLastSyncSnapshot,
    () => null,
  );
  const [draftCount, setDraftCount] = useState(draftCountExternal);
  const [lastSyncValue, setLastSyncValue] = useState<string | null>(
    lastSyncValueExternal,
  );
  const lastSyncedDate = useMemo(
    () => parseLastSync(lastSyncValue),
    [lastSyncValue],
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  // Hydrate the draft count and last-sync timestamp from IndexedDB on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [drafts, lastSync] = await Promise.all([
        getAllDrafts(),
        readLastSync(),
      ]);
      if (cancelled) return;
      setDraftCount(drafts.length);
      setLastSyncValue(lastSync);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = await getAllDrafts();
    if (queue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const outcomes = await runWithConcurrency(queue, SYNC_CONCURRENCY, postDraft);
      const remaining: DraftItem[] = [];
      queue.forEach((item, index) => {
        if (!outcomes[index]) {
          remaining.push(item);
        }
      });

      if (remaining.length === 0) {
        await clearDrafts();
      } else if (remaining.length !== queue.length) {
        // Some synced — keep the failed ones, drop the rest.
        const remainingIds = new Set(remaining.map((item) => item.id));
        const toDelete = queue
          .filter((item) => !remainingIds.has(item.id))
          .map((item) => item.id);
        await Promise.all(toDelete.map((id) => deleteDraft(id)));
      }

      const synced = queue.length - remaining.length;
      if (synced > 0) {
        const now = new Date().toISOString();
        await writeLastSync(now);
        setLastSyncValue(now);
        setDraftCount(remaining.length);
        emitSyncStorageChange();
      } else {
        setDraftCount(remaining.length);
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    function handleOnlineSync() {
      void syncNow();
    }
    window.addEventListener("online", handleOnlineSync);
    return () => window.removeEventListener("online", handleOnlineSync);
  }, [syncNow]);

  const addDraft = useCallback(
    async (item: Omit<DraftItem, "id" | "savedAt">) => {
      const draft: DraftItem = {
        ...item,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
      };
      await putDraft(draft);
      setDraftCount((count) => count + 1);
      emitSyncStorageChange();
    },
    [],
  );

  const value = useMemo<SyncContextValue>(
    () => ({
      isOnline,
      draftCount,
      lastSyncAt: lastSyncedDate,
      isSyncing,
      addDraft,
      syncNow,
    }),
    [isOnline, draftCount, lastSyncedDate, isSyncing, addDraft, syncNow],
  );

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
