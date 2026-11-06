// The telemetry block that older versions of `install` put in ~/.claude/settings.json for the office: an env block tagged
// with MY_OFFICE_OTEL, the list of keys it added. `install` no longer adds it; `uninstall` still takes out exactly those
// keys (bin/cli.mjs), so a computer that had it is left clean.

export const MARK = 'MY_OFFICE_OTEL';
export function otelEnv(port) {
  return {
    CLAUDE_CODE_ENABLE_TELEMETRY: '1',
    OTEL_METRICS_EXPORTER: 'otlp',
    OTEL_LOGS_EXPORTER: 'otlp',
    OTEL_EXPORTER_OTLP_PROTOCOL: 'http/json',
    OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${port}`,
    OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: 'delta',
    OTEL_LOG_TOOL_DETAILS: '1',
  };
}
// a key that sets up (or turns off) Claude Code's telemetry: yours unless install put it there
const TELEMETRY = /^(OTEL_|CLAUDE_CODE_ENABLE_TELEMETRY$|CLAUDE_CODE_ENHANCED_TELEMETRY_BETA$|BETA_TRACING_ENDPOINT$)/;
// still the value install wrote (the endpoint: on whichever port the office had then)
const stillOurs = (k, v) => (k === 'OTEL_EXPORTER_OTLP_ENDPOINT' ? /^http:\/\/127\.0\.0\.1:\d+\/?$/.test(String(v)) : String(v) === otelEnv(0)[k]);
export const markedKeys = (env) => String(env?.[MARK] || '').split(',').map((k) => k.trim()).filter((k) => TELEMETRY.test(k));

/** Takes the block out (in place): the keys install listed that still hold its values, and the tag. { removed, kept } */
export function removeOtel(settings) {
  const env = settings?.env;
  if (!env || typeof env !== 'object' || !(MARK in env)) return { removed: 0, kept: [] };
  let removed = 0; const kept = [];
  for (const k of markedKeys(env)) {
    if (!(k in env)) continue;
    if (stillOurs(k, env[k])) { delete env[k]; removed++; } else kept.push(k);
  }
  delete env[MARK]; removed++;   // (the tag too: an entry of ours)
  if (!Object.keys(env).length) delete settings.env;
  return { removed, kept };
}
