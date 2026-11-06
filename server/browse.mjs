// The folder browser behind "New session": the folders of this computer, one level at a time, each with how many kept
// conversations it holds (the vault's, by the folder they ran in) and whether it is a git project. Reading only; what
// starts in a folder is server/tasks.mjs. This computer only: the caller checks that before asking.
import fsp from 'node:fs/promises';
import path from 'node:path';

const SKIP = new Set(['node_modules', '.git']);
const HOME_SKIP = new Set(['Library', 'Applications', 'Movies', 'Music', 'Pictures', 'Public']);   // (a home folder's own, never projects)
const MAX = 600;

/** { home, chats: () => [{ sid, cwd, end, title, first, n, gone }], favs: () => string[], setFavs(list) } */
export function createBrowse({ home, chats, favs, setFavs }) {
  const within = (child, dir) => child === dir || child.startsWith(dir.endsWith(path.sep) ? dir : dir + path.sep);
  const isDir = async (p) => { try { return (await fsp.stat(p)).isDirectory(); } catch { return false; } };
  const isGit = async (p) => { try { await fsp.stat(path.join(p, '.git')); return true; } catch { return false; } };
  const clean = (p) => { const x = String(p || '').replace(/^~(?=$|\/)/, home); return path.isAbsolute(x) ? path.resolve(x) : ''; };
  // what the kept conversations say of a folder: the ones that ran right in it, and in all of what is under it
  function tally(dir) {
    let here = 0, deep = 0, last = 0;
    for (const c of chats()) {
      if (!c.cwd || !within(c.cwd, dir)) continue;
      deep++; last = Math.max(last, c.end || 0);
      if (c.cwd === dir) here++;
    }
    return { here, deep, last };
  }
  async function entry(p) {
    return { name: path.basename(p) || p, path: p, git: await isGit(p), ...tally(p) };
  }
  /** one level of `dir` (default: the home folder): { path, parent, name, git, here, entries: [...], favs: [...] } */
  async function list(dir, { hidden = false } = {}) {
    const at = clean(dir) || home;
    if (!(await isDir(at))) return { ok: false, code: 'noDir' };
    let names = [];
    try { names = await fsp.readdir(at, { withFileTypes: true }); } catch { return { ok: false, code: 'denied' }; }
    const dirs = [];
    for (const d of names) {
      if (SKIP.has(d.name) || (!hidden && d.name.startsWith('.')) || (at === home && HOME_SKIP.has(d.name))) continue;
      const p = path.join(at, d.name);
      if (d.isDirectory() || (d.isSymbolicLink() && await isDir(p))) dirs.push(p);
      if (dirs.length >= MAX) break;
    }
    const entries = await Promise.all(dirs.map(entry));
    entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
    const me = await entry(at);
    return { ok: true, path: at, parent: at === path.parse(at).root ? null : path.dirname(at), name: me.name, git: me.git, here: me.here, deep: me.deep, home, entries, favs: await favList() };
  }
  async function favList() {
    const out = [];
    for (const p of favs()) if (await isDir(p)) out.push(await entry(p));
    return out;
  }
  /** the folders conversations ran in lately, newest first: where a new session is likely to start */
  async function recent(limit = 12) {
    const seen = new Map();
    for (const c of chats()) if (c.cwd && path.isAbsolute(c.cwd)) seen.set(c.cwd, Math.max(seen.get(c.cwd) || 0, c.end || 0));
    const top = [...seen].sort((a, b) => b[1] - a[1]).map(([p]) => p);
    const out = [];
    for (const p of top) { if (out.length >= limit) break; if (await isDir(p)) out.push(await entry(p)); }
    return out;
  }
  /** the conversations that ran right in `dir`, newest first */
  function chatsIn(dir) {
    const at = clean(dir);
    return at ? chats().filter((c) => c.cwd === at).sort((a, b) => b.end - a.end) : [];
  }
  /** a folder starred (or not) as a place to start from; the list as it is now */
  async function star(dir, on) {
    const at = clean(dir);
    if (!at || !(await isDir(at))) return { ok: false, code: 'noDir' };
    const now = favs().filter((p) => p !== at);
    setFavs(on ? [...now, at].slice(0, 40) : now);
    return { ok: true, favs: await favList() };
  }
  return { list, recent, chatsIn, star, clean, isDir };
}
