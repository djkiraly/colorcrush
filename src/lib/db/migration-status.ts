import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

type JournalEntry = { idx: number; version: string; when: number; tag: string };

export type MigrationStatus = {
  currentVersion: number;
  currentTag: string | null;
  targetVersion: number;
  targetTag: string | null;
  isCurrent: boolean;
  applied: { idx: number; tag: string; when: number }[];
  pending: { idx: number; tag: string; when: number }[];
};

export function readJournal(folder = "src/lib/db/migrations"): JournalEntry[] {
  const journalPath = path.join(process.cwd(), folder, "meta", "_journal.json");
  const contents = fs.readFileSync(journalPath, "utf8");
  const parsed = JSON.parse(contents) as { entries: JournalEntry[] };
  return [...parsed.entries].sort((a, b) => a.idx - b.idx);
}

// Shared between the CLI migrate script and the runtime API route.
// Takes any drizzle instance (both neon-http and the lazy proxy work).
export async function getMigrationStatus(
  db: NeonHttpDatabase<Record<string, unknown>> | { execute: (q: unknown) => Promise<unknown> }
): Promise<MigrationStatus> {
  const entries = readJournal();

  // The drizzle neon-http migrator tracks applied migrations by created_at
  // (which equals each journal entry's `when`). We mirror that logic here.
  let lastCreatedAt = 0;
  try {
    const result = (await (db as { execute: (q: unknown) => Promise<unknown> }).execute(
      sql`SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 1`
    )) as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;

    const rows = Array.isArray(result) ? result : result.rows ?? [];
    if (rows.length > 0 && rows[0].created_at != null) {
      lastCreatedAt = Number(rows[0].created_at);
    }
  } catch {
    // schema or table missing — fresh DB
  }

  const applied = entries.filter((e) => e.when <= lastCreatedAt);
  const pending = entries.filter((e) => e.when > lastCreatedAt);
  const currentEntry = applied.length > 0 ? applied[applied.length - 1] : null;
  const target = entries.length > 0 ? entries[entries.length - 1] : null;

  return {
    currentVersion: currentEntry?.idx ?? -1,
    currentTag: currentEntry?.tag ?? null,
    targetVersion: target?.idx ?? -1,
    targetTag: target?.tag ?? null,
    isCurrent: pending.length === 0,
    applied: applied.map((e) => ({ idx: e.idx, tag: e.tag, when: e.when })),
    pending: pending.map((e) => ({ idx: e.idx, tag: e.tag, when: e.when })),
  };
}
