"use client";

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

const QUEUE_KEY = "ht:draft_queue";
const LAST_SYNC_KEY = "ht:last_sync_at";
const SYNC_STORAGE_EVENT = "ht:sync-storage";

export interface DraftItem {
  id: string;
  type: "biometric";
  studentId: string;
  payload: Record<string, unknown>;
  savedAt: string;
}

interface SyncContextValue {
  isOnline: boolean;
  draftCount: number;
  lastSyncAt: Date | null;
  isSyncing: boolean;
  addDraft: (item: Omit<DraftItem, "id" | "savedAt">) => void;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  isOnline: true,
  draftCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  addDraft: () => {},
  syncNow: async () => {},
});

function readQueue(): DraftItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DraftItem[];
  } catch {
    return [];
  }
}

function writeQueue(queue: DraftItem[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    emitSyncStorageChange();
  } catch {}
}

function readLastSyncValue(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

function parseLastSync(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function writeLastSync(date: Date): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, date.toISOString());
    emitSyncStorageChange();
  } catch {}
}

function emitSyncStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SYNC_STORAGE_EVENT));
  }
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
  return readQueue().length;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    readOnlineSnapshot,
    () => true,
  );
  const draftCount = useSyncExternalStore(
    subscribeSyncStorage,
    readDraftCountSnapshot,
    () => 0,
  );
  const lastSyncValue = useSyncExternalStore(
    subscribeSyncStorage,
    readLastSyncValue,
    () => null,
  );
  const lastSyncAt = useMemo(
    () => parseLastSync(lastSyncValue),
    [lastSyncValue],
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = readQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    const remaining: DraftItem[] = [];
    let synced = 0;

    for (const item of queue) {
      try {
        const res = await fetch(
          `/api/students/${item.studentId}/biometrics`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          },
        );
        if (res.ok) {
          synced += 1;
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    writeQueue(remaining);

    if (synced > 0) {
      writeLastSync(new Date());
    }

    syncingRef.current = false;
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    function handleOnlineSync() {
      syncNow();
    }
    window.addEventListener("online", handleOnlineSync);
    return () => window.removeEventListener("online", handleOnlineSync);
  }, [syncNow]);

  const addDraft = useCallback(
    (item: Omit<DraftItem, "id" | "savedAt">) => {
      const draft: DraftItem = {
        ...item,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
      };
      const queue = readQueue();
      queue.push(draft);
      writeQueue(queue);
    },
    [],
  );

  const value = useMemo<SyncContextValue>(
    () => ({ isOnline, draftCount, lastSyncAt, isSyncing, addDraft, syncNow }),
    [isOnline, draftCount, lastSyncAt, isSyncing, addDraft, syncNow],
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
