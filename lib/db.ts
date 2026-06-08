import { createClient, type Client } from "@libsql/client";
import type { SearchRecord, ApiIdentifyResponse } from "./types";

// Persistence backend:
//   • Production (Vercel): set TURSO_DATABASE_URL (libsql://…) + TURSO_AUTH_TOKEN.
//   • Local dev: falls back to a local SQLite file (file:searches.db).
// History degrades gracefully — if the database can't be reached, reads return
// empty and writes no-op instead of throwing (the core identify/search flow is
// unaffected).
let _client: Client | null = null;
let _initPromise: Promise<Client | null> | null = null;
let _unavailable = false;

function makeClient(): Client {
  const url = process.env.TURSO_DATABASE_URL || "file:searches.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;
  return createClient(authToken ? { url, authToken } : { url });
}

async function getClient(): Promise<Client | null> {
  if (_client) return _client;
  if (_unavailable) return null;
  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const client = makeClient();
        await client.execute(`
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
        _client = client;
        return client;
      } catch (err) {
        _unavailable = true;
        console.warn(`[db] libSQL unavailable, history disabled: ${String(err)}`);
        return null;
      }
    })();
  }
  return _initPromise;
}

export async function insertSearch(params: {
  thumbData?: string;
  productName: string;
  brand: string;
  category: string;
  resultsJson: string;
}): Promise<number> {
  const client = await getClient();
  if (!client) return -1;
  try {
    const result = await client.execute({
      sql: `INSERT INTO searches (thumb_data, product_name, brand, category, results_json)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        params.thumbData ?? null,
        params.productName,
        params.brand,
        params.category,
        params.resultsJson,
      ],
    });
    return result.lastInsertRowid != null ? Number(result.lastInsertRowid) : -1;
  } catch (err) {
    console.warn(`[db] insertSearch failed: ${String(err)}`);
    return -1;
  }
}

export async function listSearches(limit = 20): Promise<SearchRecord[]> {
  const client = await getClient();
  if (!client) return [];
  try {
    const rs = await client.execute({
      sql: `SELECT id, created_at, thumb_data, product_name, brand, category
            FROM searches ORDER BY created_at DESC, id DESC LIMIT ?`,
      args: [limit],
    });
    return rs.rows.map((r) => ({
      id: Number(r.id),
      createdAt: String(r.created_at),
      thumbData: r.thumb_data == null ? undefined : String(r.thumb_data),
      productName: String(r.product_name),
      brand: String(r.brand),
      category: String(r.category),
    }));
  } catch (err) {
    console.warn(`[db] listSearches failed: ${String(err)}`);
    return [];
  }
}

export async function getSearch(
  id: number
): Promise<(ApiIdentifyResponse & { id: number; thumbData?: string }) | null> {
  const client = await getClient();
  if (!client) return null;
  try {
    const rs = await client.execute({
      sql: `SELECT id, thumb_data, results_json FROM searches WHERE id = ?`,
      args: [id],
    });
    const row = rs.rows[0];
    if (!row || row.results_json == null) return null;

    const data = JSON.parse(String(row.results_json)) as ApiIdentifyResponse;
    return {
      id: Number(row.id),
      thumbData: row.thumb_data == null ? undefined : String(row.thumb_data),
      identification: data.identification,
      products: data.products,
    };
  } catch (err) {
    console.warn(`[db] getSearch failed: ${String(err)}`);
    return null;
  }
}
