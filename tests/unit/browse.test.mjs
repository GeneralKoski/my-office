import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBrowse } from '../../server/browse.mjs';

function setup() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'browse-'));
  for (const d of ['Work/alpha/.git', 'Work/beta/inner', 'Work/.hidden', 'Work/node_modules', 'Library/x', 'Docs']) fs.mkdirSync(path.join(home, d), { recursive: true });
  fs.writeFileSync(path.join(home, 'Work', 'file.txt'), 'x');
  const chats = [
    { sid: 's1', cwd: path.join(home, 'Work', 'alpha'), end: 300 },
    { sid: 's2', cwd: path.join(home, 'Work', 'alpha'), end: 200 },
    { sid: 's3', cwd: path.join(home, 'Work', 'beta', 'inner'), end: 100 },
    { sid: 's4', cwd: path.join(home, 'Work', 'gone-dir'), end: 400 },
  ];
  let favs = [];
  const b = createBrowse({ home, chats: () => chats, favs: () => favs, setFavs: (l) => { favs = l; } });
  return { home, b, favs: () => favs };
}

test('one level: folders only, no hidden ones or node_modules, git and chat counts', async () => {
  const { home, b } = setup();
  const r = await b.list(path.join(home, 'Work'));
  assert.equal(r.ok, true);
  assert.deepEqual(r.entries.map((e) => e.name), ['alpha', 'beta']);
  assert.deepEqual(r.entries.map((e) => [e.git, e.here, e.deep]), [[true, 2, 2], [false, 0, 1]]);
  assert.equal(r.parent, home);
  assert.deepEqual((await b.list(path.join(home, 'Work'), { hidden: true })).entries.map((e) => e.name), ['.hidden', 'alpha', 'beta']);
});

test('the home folder: its own system folders are left out; ~ and relative paths', async () => {
  const { home, b } = setup();
  assert.deepEqual((await b.list('')).entries.map((e) => e.name), ['Docs', 'Work']);
  assert.equal((await b.list('~')).path, home);
  assert.equal(b.clean('relative/dir'), '');
  assert.equal(b.clean('~/Work'), path.join(home, 'Work'));
});

test('a path that is not a folder, or is gone', async () => {
  const { home, b } = setup();
  assert.deepEqual(await b.list(path.join(home, 'Work', 'file.txt')), { ok: false, code: 'noDir' });
  assert.deepEqual(await b.list(path.join(home, 'nope')), { ok: false, code: 'noDir' });
});

test('recent: the folders chats ran in, newest first, only those that still exist', async () => {
  const { home, b } = setup();
  assert.deepEqual((await b.recent()).map((f) => f.path), [path.join(home, 'Work', 'alpha'), path.join(home, 'Work', 'beta', 'inner')]);
});

test('chats in a folder: the ones that ran right there, newest first', () => {
  const { home, b } = setup();
  assert.deepEqual(b.chatsIn(path.join(home, 'Work', 'alpha')).map((c) => c.sid), ['s1', 's2']);
  assert.deepEqual(b.chatsIn(path.join(home, 'Work')), []);
});

test('stars: kept, removed, and only for folders that exist', async () => {
  const { home, b, favs } = setup();
  const a = path.join(home, 'Work', 'alpha');
  assert.deepEqual((await b.star(a, true)).favs.map((f) => f.path), [a]);
  assert.deepEqual((await b.star(a, true)).favs.map((f) => f.path), [a]);
  assert.deepEqual((await b.star(a, false)).favs, []);
  assert.deepEqual(favs(), []);
  assert.deepEqual(await b.star(path.join(home, 'nope'), true), { ok: false, code: 'noDir' });
});
