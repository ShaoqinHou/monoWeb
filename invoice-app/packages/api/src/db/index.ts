import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

/**
 * Create a Drizzle database instance backed by better-sqlite3.
 *
 * @param dbPath - Path to the SQLite file, or ':memory:' for in-memory DB (tests).
 */
export function createDb(dbPath: string = './data/app.db') {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  return { db, sqlite };
}

export type Db = ReturnType<typeof createDb>['db'];
