import { deleteIds, selectAll, upsertRows } from "./db";

/* ── Conversions between the apps' shapes and database columns ── */
/** Epoch milliseconds → ISO timestamp (null stays null). */
export const ts = (ms) => (ms ? new Date(ms).toISOString() : null);
/** ISO timestamp → epoch milliseconds (null stays undefined). */
export const ms = (iso) => (iso ? Date.parse(iso) : undefined);

const SAVE_DELAY = 500;
const RETRY_DELAY = 4000;
const KEEPALIVE_LIMIT = 60_000; // browsers cap keepalive request bodies at 64 KB

const flagKey = (key) => `daily:migrated:${key}`;
const readFlag = (key) => { try { return localStorage.getItem(flagKey(key)) === "1"; } catch { return false; } };
const writeFlag = (key) => { try { localStorage.setItem(flagKey(key), "1"); } catch { /* storage unavailable */ } };

/** { table: rows[] } → { table: Map(id → json) } so changes can be spotted by comparing strings. */
function index(tables, rowsByTable) {
  const out = {};
  for (const { name } of tables) out[name] = new Map((rowsByTable[name] ?? []).map((r) => [r.id, JSON.stringify(r)]));
  return out;
}

/**
 * Keeps one app's state in Supabase.
 *
 *  key      short name of the app (also names the one-time import flag)
 *  tables   [{ name, order, chunk? }] parents first (children are deleted first, saved last)
 *  toRows   state → { [table]: row[] }   every row has a string `id` and the same keys every time
 *  fromRows { [table]: row[] } → state
 *  legacy   optional () → state | null   the data this app used to keep in localStorage
 *
 * Saving is a diff: only rows that changed since the last successful save are sent.
 */
export function createStore({ key, tables, toRows, fromRows, legacy }) {
  let synced = index(tables, {}); // what the database holds, as far as we know
  let latest = null;              // newest state waiting to be saved
  let timer = null;
  let chain = Promise.resolve();
  let failures = 0;
  let afterSave = null;           // runs after the first successful save (marks the import done)
  let onError = () => {};

  const diff = (state) => {
    const rowsNow = toRows(state);
    return tables.map(({ name, chunk = 100 }) => {
      const before = synced[name];
      const rows = rowsNow[name] ?? [];
      const ids = new Set(rows.map((r) => r.id));
      const upserts = rows.filter((r) => before.get(r.id) !== JSON.stringify(r));
      const deletes = [...before.keys()].filter((id) => !ids.has(id));
      return { name, chunk, upserts, deletes };
    });
  };

  async function push(state, keepalive) {
    const plan = diff(state);
    const size = keepalive ? JSON.stringify(plan.map((p) => p.upserts)).length : 0;
    const opts = { keepalive: keepalive && size < KEEPALIVE_LIMIT };

    // Parents first for inserts/updates…
    for (const p of plan) {
      for (let i = 0; i < p.upserts.length; i += p.chunk) {
        const rows = p.upserts.slice(i, i + p.chunk);
        await upsertRows(p.name, rows, opts);
        for (const r of rows) synced[p.name].set(r.id, JSON.stringify(r));
      }
    }
    // …children first for deletes.
    for (const p of [...plan].reverse()) {
      for (let i = 0; i < p.deletes.length; i += 100) {
        const ids = p.deletes.slice(i, i + 100);
        await deleteIds(p.name, ids, opts);
        for (const id of ids) synced[p.name].delete(id);
      }
    }
  }

  function flush({ keepalive = false } = {}) {
    clearTimeout(timer);
    if (latest === null) return chain;
    const state = latest;
    latest = null;
    chain = chain.then(async () => {
      try {
        await push(state, keepalive);
        failures = 0;
        if (afterSave) { afterSave(); afterSave = null; }
      } catch (err) {
        failures += 1;
        if (failures === 1) onError(err);
        if (latest === null) latest = state; // nothing newer: retry this one
        timer = setTimeout(() => flush(), RETRY_DELAY * Math.min(failures, 5));
      }
    });
    return chain;
  }

  return {
    /** Called when saving fails (once per streak of failures). */
    setErrorHandler(fn) { onError = fn; },

    /** Load the state. On the first run on a device, folds in what used to be saved in localStorage. */
    async load() {
      await chain; // let a save from a just-closed screen finish first
      clearTimeout(timer);
      latest = null;
      afterSave = null;

      const dbRows = {};
      await Promise.all(tables.map(async (t) => { dbRows[t.name] = await selectAll(t.name, t.order); }));
      const dbState = fromRows(dbRows);
      synced = index(tables, toRows(dbState)); // compare like with like

      const old = !readFlag(key) && legacy ? legacy() : null;
      if (!old) return dbState;

      // Merge by id; the browser's own copy wins, then it is pushed up on the first save.
      const oldRows = toRows(old);
      const merged = {};
      for (const { name } of tables) {
        const byId = new Map((toRows(dbState)[name] ?? []).map((r) => [r.id, r]));
        for (const r of oldRows[name] ?? []) byId.set(r.id, r);
        merged[name] = [...byId.values()];
      }
      afterSave = () => writeFlag(key);
      return fromRows(merged);
    },

    /** Save soon (debounced). */
    schedule(state) {
      latest = state;
      clearTimeout(timer);
      timer = setTimeout(() => flush(), SAVE_DELAY);
    },

    /** Save now — used when the screen closes or the tab is hidden. */
    flush,
  };
}
