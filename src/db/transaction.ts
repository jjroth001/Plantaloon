import type { SQLiteDatabase } from 'expo-sqlite';

// The app shares one connection, where a second BEGIN while a transaction is open fails
// ("cannot start a transaction within a transaction") — easy to hit by tapping Done on two
// rows quickly. Transactions therefore run one after another.
let queue: Promise<unknown> = Promise.resolve();

export function transaction(db: SQLiteDatabase, task: () => Promise<void>): Promise<void> {
  const run = queue.then(() => db.withTransactionAsync(task));
  queue = run.catch(() => {});
  return run;
}
