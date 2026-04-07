import { Database } from 'bun:sqlite';
import fs from 'fs';
import path from 'path';

function initDb(db: Database): void {
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  // better-auth tables (camelCase columns)
  db.run(`CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expiresAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    idToken TEXT,
    password TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // App table (snake_case columns)
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_json TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    public_slug TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
  )`);

  db.run('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notes_public_slug ON notes(public_slug)');
  db.run('CREATE INDEX IF NOT EXISTS idx_notes_is_public ON notes(is_public)');
}

const _dbPath = path.resolve(process.env.DB_PATH ?? 'data/app.db');
fs.mkdirSync(path.dirname(_dbPath), { recursive: true });
const _db = new Database(_dbPath);
initDb(_db);

export function getDb(): Database {
  return _db;
}

type SQLParams = Parameters<Database['run']>[1];

export function query<T = Record<string, unknown>>(sql: string, params?: SQLParams): T[] {
  return getDb()
    .query<T, SQLParams>(sql)
    .all(params ?? []);
}

export function get<T = Record<string, unknown>>(sql: string, params?: SQLParams): T | undefined {
  return (
    getDb()
      .query<T, SQLParams>(sql)
      .get(params ?? []) ?? undefined
  );
}

export function run(sql: string, params?: SQLParams): void {
  getDb().run(sql, params ?? []);
}
