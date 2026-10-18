import { addDatabaseChangeListener, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import type { Table } from './use-db-query';

type State<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: Error };

const LOADING: State<never> = { status: 'loading', data: undefined, error: undefined };
/** A burst of row changes (a transaction, a restore) becomes one re-query. */
const RERUN_DELAY_MS = 16;

/**
 * One query shared by every screen that asks for it: it runs once per change instead of once
 * per screen, and a screen opened later gets the last result straight away (refreshed in the
 * background) instead of starting empty. Stays loaded while nothing is watching, so going
 * back to a screen is instant too.
 */
class SharedQuery<T> {
  private state: State<T> = LOADING;
  private listeners = new Set<() => void>();
  private stop: (() => void) | null = null;
  private latestRun = 0;

  constructor(
    private db: SQLiteDatabase,
    private tables: readonly Table[],
    private query: (db: SQLiteDatabase) => Promise<T>,
  ) {}

  getSnapshot = (): State<T> => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(listener);
      // Stop listening a moment later, so a screen swap doesn't stop and restart it.
      if (this.listeners.size === 0) {
        setTimeout(() => {
          if (this.listeners.size === 0) this.halt();
        }, 1000);
      }
    };
  };

  private start() {
    if (this.stop) return;
    // Whatever's cached may be out of date: check again (the cached data shows meanwhile).
    this.run();
    let pending: ReturnType<typeof setTimeout> | undefined;
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (!(this.tables as readonly string[]).includes(tableName)) return;
      clearTimeout(pending);
      pending = setTimeout(() => this.run(), RERUN_DELAY_MS);
    });
    this.stop = () => {
      clearTimeout(pending);
      subscription.remove();
    };
  }

  private halt() {
    this.stop?.();
    this.stop = null;
  }

  private run() {
    const thisRun = ++this.latestRun;
    this.query(this.db).then(
      (data) => this.settle(thisRun, { status: 'success', data, error: undefined }),
      (error: Error) => this.settle(thisRun, { status: 'error', data: undefined, error }),
    );
  }

  private settle(run: number, state: State<T>) {
    if (run !== this.latestRun) return;
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}

const shared = new WeakMap<SQLiteDatabase, Map<string, SharedQuery<unknown>>>();

/**
 * Like useDbQuery, but shared app-wide under `key`: use it for data many screens need (the
 * whole garden, settings). `query` must always return the same thing for the same key.
 */
export function useSharedQuery<T>(
  key: string,
  tables: readonly Table[],
  query: (db: SQLiteDatabase) => Promise<T>,
): State<T> {
  const db = useSQLiteContext();
  let byKey = shared.get(db);
  if (!byKey) shared.set(db, (byKey = new Map()));
  let entry = byKey.get(key) as SharedQuery<T> | undefined;
  if (!entry) byKey.set(key, (entry = new SharedQuery(db, tables, query)));
  return useSyncExternalStore(entry.subscribe, entry.getSnapshot);
}
