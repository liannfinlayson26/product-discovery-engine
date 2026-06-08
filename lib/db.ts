import Database from "better-sqlite3";
import path from "path";
import type { SearchRecord, ApiIdentifyResponse } from "./types";

const DB_PATH = path.join(process.cwd(), "searches.db");

let _db: Database.Database | null = null;
// Once SQLite proves unavailable (e.g. a read-only serverless filesystem on
// Vercel), stop retrying and let history degrade gracefully instead of erroring.
let _dbUnavailable = false;

function getDb(): Database.Database | null {
  if (_db) return _db;
  if (_dbUnavailable) return null;
  try {
    _db = new Database(DB_PATH);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS searches (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        thumb_data   TEXT,
        product_name TEXT,
        brand        TEXT,
        category     TEXT,
        results_json TEXT
      )
    `);
    return _db;
  } catch (err) {
    _dbUnavailable = true;
    console.warn(
      `[db] SQLite unavailable, history disabled: ${String(err)}`
    );
    return null;
  }
}

export function insertSearch(params: {
  thumbData?: string;
  productName: string;
  brand: string;
  category: string;
  resultsJson: string;
}): number {
  const db = getDb();
  if (!db) return -1;
  try {
    const stmt = db.prepare(`
      INSERT INTO searches (thumb_data, product_name, brand, category, results_json)
      VALUES (@thumbData, @productName, @brand, @category, @resultsJson)
    `);
    const result = stmt.run(params);
    return result.lastInsertRowid as number;
  } catch (err) {
    console.warn(`[db] insertSearch failed: ${String(err)}`);
    return -1;
  }
}

export function listSearches(limit = 20): SearchRecord[] {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = db
      .prepare(
        `SELECT id, created_at, thumb_data, product_name, brand, category
         FROM searches ORDER BY created_at DESC LIMIT ?`
      )
      .all(limit) as Array<{
      id: number;
      created_at: string;
      thumb_data: string | null;
      product_name: string;
      brand: string;
      category: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      thumbData: r.thumb_data ?? undefined,
      productName: r.product_name,
      brand: r.brand,
      category: r.category,
    }));
  } catch (err) {
    console.warn(`[db] listSearches failed: ${String(err)}`);
    return [];
  }
}

export function getSearch(
  id: number
): (ApiIdentifyResponse & { id: number; thumbData?: string }) | null {
  const db = getDb();
  if (!db) return null;
  try {
    const row = db
      .prepare(`SELECT id, thumb_data, results_json FROM searches WHERE id = ?`)
      .get(id) as
      | { id: number; thumb_data: string | null; results_json: string | null }
      | undefined;

    if (!row || !row.results_json) return null;

    const data = JSON.parse(row.results_json) as ApiIdentifyResponse;
    return {
      id: row.id,
      thumbData: row.thumb_data ?? undefined,
      identification: data.identification,
      products: data.products,
    };
  } catch (err) {
    console.warn(`[db] getSearch failed: ${String(err)}`);
    return null;
  }
}
