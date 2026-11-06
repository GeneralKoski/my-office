// `install` no longer touches Claude Code's telemetry; `uninstall` still takes out exactly the block older versions put in.
// Run as the real command against settings in a home folder of its own (never ~/.claude).
// (--no-status: the status line's saved copy lives in the repository's data folder, which a test must not touch)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { removeOtel, otelEnv, MARK } from '../../server/otel-setup.mjs';

const CLI = path.resolve(import.meta.dirname, '../../bin/cli.mjs');
function home() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'office-install-'));
  const settings = path.join(root, 'home', '.claude', 'settings.json');
  fs.mkdirSync(path.dirname(settings), { recursive: true });
  const env = { PATH: process.env.PATH, HOME: path.join(root, 'home'), USERPROFILE: path.join(root, 'home'), OFFICE_DATA_DIR: path.join(root, 'data'), OFFICE_LANG: 'en',
    OFFICE_MANAGED_DIR: path.join(root, 'managed'), OFFICE_PORT: '4399' };
  const run = (...args) => execFileSync(process.execPath, [CLI, ...args, '--no-status', '--settings', settings], { env, encoding: 'utf8' });
  const read = () => JSON.parse(fs.readFileSync(settings, 'utf8'));
  const write = (o) => fs.writeFileSync(settings, JSON.stringify(o, null, 2));
  return { root, settings, run, read, write, env, done: () => fs.rmSync(root, { recursive: true, force: true }) };
}

const block = () => ({ ...otelEnv(4399), [MARK]: Object.keys(otelEnv(4399)).join(',') });

test('install leaves the telemetry alone; uninstall takes out exactly the block an older install added', () => {
  const h = home();
  try {
    h.write({ env: { MY_OWN: 'x', ...block() }, model: 'opus' });
    h.run('install');
    assert.deepEqual(h.read().env, { MY_OWN: 'x', ...block() }, 'install adds nothing of its own to the env block');
    h.run('uninstall');
    const after = h.read();
    assert.deepEqual(after.env, { MY_OWN: 'x' }, 'only what the older install added is gone');
    assert.equal(after.model, 'opus');
    h.run('uninstall');   // (again: nothing left to take out, nothing broken)
    assert.deepEqual(h.read().env, { MY_OWN: 'x' });
  } finally { h.done(); }
});

test('a fresh install writes no telemetry at all', () => {
  const h = home();
  try {
    h.write({});
    h.run('install');
    assert.equal(h.read().env, undefined);
  } finally { h.done(); }
});

test('telemetry of your own is never taken out, and a value you changed after install is kept', () => {
  const h = home();
  try {
    const mine = { CLAUDE_CODE_ENABLE_TELEMETRY: '1', OTEL_METRICS_EXPORTER: 'otlp', OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc', OTEL_EXPORTER_OTLP_ENDPOINT: 'http://collector.example.com:4317' };
    h.write({ env: { ...mine } });
    h.run('uninstall');
    assert.deepEqual(h.read().env, mine);
    h.write({ env: { ...block(), OTEL_LOG_TOOL_DETAILS: '0' } });
    const out = h.run('uninstall');
    assert.match(out, /OTEL_LOG_TOOL_DETAILS/);
    assert.deepEqual(h.read().env, { OTEL_LOG_TOOL_DETAILS: '0' });
    const cfg = { env: { ...block(), OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4311' } };
    assert.deepEqual(removeOtel(cfg), { removed: 8, kept: [] }, 'the endpoint follows whichever port the office had');
    assert.deepEqual(cfg, {});
  } finally { h.done(); }
});
