# Architecture

My Office is two programs in one repository:

1. **A local server** (`server/`, plain Node.js ESM, no build step). Claude Code hooks POST every event to it; it keeps one
   record per open session, measures the Mac, and streams compact events to the page over Server-Sent Events. It also
   hosts Next.js, which renders the page.
2. **The page** (`app/`, `src/`). A Next.js App Router page whose markup is static React components; the list of sessions and
   the session page are driven by plain JavaScript modules in `src/office/`.

```
Claude Code ──hooks (curl, loopback only)──▶ server/index.mjs ──SSE /stream──▶ the page (src/office)
                                               │   ▲                               │
                    ~/.claude/sessions, transcripts   /api/* (sys, log, timeline, replay, todos, perm…)
Claude Code ──OpenTelemetry (OTLP/HTTP JSON)──▶ /v1/metrics, /v1/logs ──▶ server/otel.mjs ──/api/burn
```

## Server (`server/`)

| File | What it does |
| --- | --- |
| `index.mjs` | HTTP server: hook intake (`/event`, `/hook/*`), the live stream, the API, the phone PIN page; hands every page request to Next.js. Loopback-only for hooks, a host allow-list against DNS rebinding, a 6-digit PIN for phones. |
| `platform/` | The machine's readings, one module per system with the same functions: `darwin.mjs` (ps, top, vm_stat, lsof, the keychain), `linux.mjs` (/proc only, so it works in slim containers), `win32.mjs` (one PowerShell CIM reading shared for two seconds). |
| `system.mjs` | The Mac panel: memory, CPU, disk, dev servers, idle Claude sessions, cleanups; safe stops (a process is only signalled if its start time matches what you saw). |
| `usage.mjs` | Tokens and API-price equivalents read from transcripts. |
| `vault.mjs` | "Kho lịch sử": the words of every conversation (your prompts, Claude's text, title, folder, times) kept in data/vault after Claude Code deletes the transcript; one gzip each and an index, read from every account's projects folder every 3 hours; search with or without accents. |
| `prompt-report.mjs` | "Phiếu điểm prompt": a week of what you wrote (from the vault), looked at with the chat's prompt-helper rules (src/shared/prompt-coach.js): how many were clear, which habits cost a round trip, one example of each. No model. |
| `trophies.mjs` | All-time totals and milestones for the trophy cabinet (`data/totals.json`). |
| `redact.mjs` | Masks secrets in anything shown in the UI. |
| `git.mjs` | Git per session folder (branch, uncommitted files, commits and pushes by watching HEAD and the upstream) and the latest CI run through `gh`. |
| `wrapped.mjs` | The weekly recap: totals over the last seven replay logs. |
| `loops.mjs` | "Ngắt vòng lặp kẹt": a session going round in circles (the same call failing the same way N times, compaction after compaction, cost rising with nothing edited), from the hooks and the status line; the synchronous PreToolUse hook (`/hook/loop`) gets a deny, your hint or Stop back from it. |
| `overlap.mjs` | "Chặn ghi đè và giành cổng": what each session edited, so another session about to edit the same file within 20 minutes is told first (with its next call, through the synchronous `/hook/loop`); the port a command says it couldn't have (EADDRINUSE, "Port 3000 is in use"), and a word kept for a session until its next call. Memory only. |
| `undo.mjs` | "Hoàn tác lượt cuối": the office's own copy of each file a turn's file tools touch (made by /hook/loop before the write), per turn, the last 3; the plan (restore, delete, same, changed after, too big) and putting them back, what was there kept aside. |
| `vsix.mjs` | The editor side-bar panel (vscode-extension/: a webview of the office's light page /panel) packed as a .vsix (a stored zip written here) and put into each editor opened on this computer with its own `--install-extension` (Antigravity, VS Code, Cursor, Windsurf…); `install` and `uninstall` call it, `doctor` checks the editors' extension folders. |
| `../menubar/MyOfficeBar.swift` | The Mac's menu bar icon (built by `install` with swiftc into an app in the data folder, started by the server): reads /api/panel every 3 s for the number of sessions waiting or at work and the limits' level, opens /panel in a popover, notifies when a session starts waiting or finishes. |
| `models.mjs` | "Model: người điều phối và subagent" (Settings → More): the session's model (`model` in ~/.claude/settings.json) and its subagents' (env CLAUDE_CODE_SUBAGENT_MODEL, and _FORCE for every subagent), and the office's note in ~/.claude/CLAUDE.md asking Claude to split big tasks among subagents, taken out exactly when off. |
| `codex-accounts.mjs` | "Nhiều tài khoản Codex": the ChatGPT accounts Codex signs in with. Each has a copy of its sign-in (a Codex home of its own in data/codex) so `codex app-server` reads its usage; using one puts its auth.json into ~/.codex (the one there saved back first: refresh tokens rotate), adding one runs Codex's sign-in in a home of its own; switching by itself when the one in use runs out. Which account a running codex started on, from when each sat in ~/.codex. |
| `antigravity-accounts.mjs` | "Nhiều tài khoản Antigravity": Antigravity IDE's sign-in and what it heard of the account (quota per model) from its state database (protobuf in base64, read with sqlite3); each account's pair kept in data/antigravity and written back while the IDE is closed (a switch waits for it to close, or the office closes and reopens it, never with a Claude session in it at work); adding one takes the sign-in out and opens the IDE. |
| `otel.mjs` | "What eats your plan": an OpenTelemetry receiver for Claude Code's own cost and token counters and api_request events (OTLP/HTTP JSON at `/v1/metrics` and `/v1/logs`, loopback only). Delta and cumulative counters each counted once; a session is read from its counters, or from its events when it sent none; daily sums per session and attribution in `data/otel/`, 30 days. `src/shared/burn.js` sums them for `/api/burn` and the demo. |
| `otel-setup.mjs` | The telemetry block `install` adds to `~/.claude/settings.json` (only when there is none of yours, tagged so `uninstall` removes exactly it), and how to tell whose telemetry it is. |
| `tasks.mjs` | "Give work": a `claude -p` run on this Mac from the chat or a phone, carrying on a tagged conversation (`--resume --fork-session`) or new in a known folder; caps, photos, its answer back to the chat. |
| `bg-sessions.mjs` | Phone work as Claude Code background sessions: whether this Claude Code has them (`--help`), what `claude --bg` printed, a `claude agents --json` row as the card's state, and the settings each one gets (edits in place, `/hook/bind`, approvals and questions held until answered with `?long=1`). |
| `steer.mjs` | "Chen lời giữa chừng": a note into a working session through its inbox socket (the line it takes, whether it can take one now: permission mode and `crossSessionInbound`), else kept for when it is done. |
| `rewrite.mjs` | The chat's "✨ Viết lại cho rõ": a message for Claude rewritten as goal / context / done-when by `claude -p` on a small model, with no tools, one turn, no session saved and the hooks off; text only, one at a time, 20 an hour. The rest of the prompt helper is in the page (`src/shared/prompt-coach.js`). |
| `tenure.mjs` | Each project's working life (`data/tenure.json`): first and last session, on how many days, how many turns; which are due a farewell (Settings → More), which came back, which are still interns and which are ready to be made permanent. The first run reads, once, the dates and folders of Claude Code's transcripts (the projects already there). |
| `lift-service.mjs` | The lift's servicing after a start (a scene the office draws, `life/lift-service.js`): three minutes, five when the server starts on a build it has not run before (`data/lift.json` keeps the last one); the inspection sticker that build gets. In the live snapshot as `lift`. |
| `prefs.mjs` | The office's language (`data/prefs.json`, `OFFICE_LANG`) and the server's translator `tr()`. |

The page no longer has a screen for the history vault, the weekly prompt report, "What eats your plan", the Mac panel
(and forgotten work), the Codex and Antigravity accounts, or the group chat (with its cards for CI, refused calls, stuck
loops and "Give work"). Their server modules and endpoints are still here, and `src/shared/` still holds what the
server imports from the old page (`chat-engine.js`, `prompt-coach.js`, `burn.js`, `timeline.js`, `danger.js`,
`cache-clock.js`).

`bin/cli.mjs` installs the hooks (curl on macOS and Linux, `hooks/send.mjs` on Windows) and, through `bin/service.mjs`, the
background service: launchd, a systemd user service, or a script in the Windows Startup folder.

Runtime state lives in `data/` (git-ignored): the access token, phone PIN, replay logs (7 days), usage sums (`otel/`, 30 days), totals, each project's working life (`tenure.json`), caches.

## The page (`app/`, `src/components/`, `src/styles/`)

* `app/layout.tsx` loads the stylesheets (one per area of the screen, in cascade order) and the QR library.
* `app/page.tsx` composes the static markup: `TopBar`, `Stage` (the list, the approvals and their overlays),
  `SessionDrawer` (the session page), the phone modal, the toast, and `OfficeBoot`. Settings (`SettingsPanel`) is part of
  the top bar.
* `src/components/OfficeBoot.tsx` is the only client component: once the markup is on screen it dynamically imports
  `src/office/main.js` and calls `startOffice()`.

The markup components render once and never re-render: the office finds elements by `id` and fills them in. Moving a
panel to stateful React is welcome, one panel at a time (see CONTRIBUTING).

## The page's modules (`src/office/`)

Every module exports what other modules use, and may export a `setup()` that does its work at start: wiring its panel,
opening the live connection. `main.js` runs the `setup()`s in a fixed order, so a module may use anything set up by a
module listed before it. Functions can call into later modules freely (they run after start-up).

The sessions the server reports live in one map (`core/sessions.js`: `sessions`, and how a session is named, coloured
and marked); `net/live.js` and `demo/demo.js` fill it from the stream, `ui/lite.js` draws it as rows, and `ui/events.js`
is what the page does with each event (sounds, toasts, the feed, the open log).

Values that several modules assign (the selection `state.selectedId`, the connection, mode switches…) live on the
shared object in `core/state.js`; everything else is an ordinary import.

There used to be a 3D office next to the list (three.js), and around it a left rail, an activity column, a group chat
and the Mac, burn and vault drawers. This fork removed them: the page is a top bar, the list, the session page and the
floating approvals (on a phone, a bottom bar with Sessions and Approvals). Nothing under `src/office` imports `three`.

## Languages (`src/i18n/`)

The office has one language at a time, picked in Settings and kept by the server, because the server writes some of
the words too (event labels, cleanup tips, trophy names). On each page request the server puts it in the
`x-office-lang` header; components read it with `getT()` (`src/i18n/server.ts`), the layout sets `<html lang>`, and the
engine's `tr()` reads that attribute. Changing the language broadcasts `{k:'lang'}` and every open page reloads.
`?lang=vi` shows one visit in another language. The dictionaries are plain JS objects, one folder per language and one
file per area; English is the reference and the fallback.

## The online demo

`OFFICE_STATIC=1 next build` exports the page as a static site that runs demo mode with no server
(`scripts/build-demo.mjs` builds every language, English at the root and the others under `/<lang>/`;
`.github/workflows/pages.yml` publishes it). In that build `getLang()` takes the language from the build, and the
engine switches to demo mode and talks to no API.

### Module map

| Module | Lines | What it is |
| --- | ---: | --- |
| `audio/sfx.js` | 44 | Sounds, synthesized in the browser. |
| `core/env.js` | 26 | Page-wide basics: DOM helpers, formatting. |
| `core/sessions.js` | 8 | The sessions the server reports (id -> session) and how they are named and coloured on screen. |
| `core/state.js` | 3 | Values that more than one module assigns (the clock, the selection, mode switches…), on one shared object so any module can change them. |
| `demo/demo-log.js` | 17 | The demo's conversation logs (a session's, shown in its drawer, and each subagent's steps), kept to what the drawer can show. |
| `demo/demo.js` | 225 | Demo mode: fictional projects. |
| `life/your-turn.js` | 35 | "Your turn": sessions that finished or wait for you. |
| `net/live.js` | 20 | The live connection: the sessions the server reports. |
| `ui/activity.js` | 59 | Toasts, the rows of the activity feed (a session's Activity tab) and the redraw queue. |
| `ui/cache-words.js` | 29 | How a session's prompt cache reads on screen ("Đồng hồ bộ nhớ đệm", src/shared/cache-clock.js): the line under the session page's folder. |
| `ui/composer.js` | 83 | The box under a conversation (the session page's Chat tab): a message to that session. |
| `ui/event-text.js` | 46 | How events read on screen: a session's state and the verb of each event. |
| `ui/events.js` | 25 | What the list does with each event of the stream: the sounds, the toasts, the feed and the open log. |
| `ui/icons.js` | 44 | Stroke icons (24 px grid) and the icon helper. |
| `ui/image-view.js` | 28 | Images in the feed: a session that read, wrote or edited an image gets a thumbnail on that line (activity.js), and a click opens it here, large, over the page (the server serves it by id: GET /api/image). |
| `ui/lite.js` | 115 | The page's one view, the list: every session as a row. |
| `ui/mac-approve.js` | 22 | Settings → More: "Approve from the Mac's notifications" (on by default; kept by the server, data/prefs.json). |
| `ui/models.js` | 43 | "Model: người điều phối và subagent" (Settings → More; server/models.mjs): the model a Claude session runs on, the one its subagents run on, always that one or only when Claude doesn't pick, and the note asking Claude to split big tasks. |
| `ui/notify.js` | 60 | Notifications on this phone (Web Push: server/push.mjs sends them, public/sw.js shows them): an approval waiting, even with the office closed and the phone locked. |
| `ui/permissions.js` | 147 | Approve / deny cards and Claude's questions. |
| `ui/phone.js` | 69 | The page on a phone: an app-like layout for small screens, upright or held sideways. |
| `ui/pins.js` | 63 | "Ghi nhớ cho Claude" (server: /api/pins, /hook/start): what you want a conversation to keep in mind, said to Claude again each time Claude Code compacts it. |
| `ui/plan.js` | 81 | The plan's limits (from Claude Code's status line): the 5 hours and the week as two rings in the top bar, a toast as a window fills up, and the words for the accounts the session page's "Change account" lists. |
| `ui/session-account.js` | 54 | "Change account" in a session's drawer (on this computer only): the Claude accounts the server knows, each with what it has left. |
| `ui/session-drawer.js` | 408 | The session page: chat, steps, subagents. |
| `ui/settings.js` | 64 | Settings popover: language, toggles, alerts and the phone. |
| `ui/stuck.js` | 37 | Stuck sessions ("Ngắt vòng lặp kẹt", server/loops.mjs): the row in Settings → More (on or off, after how many failures, after how many minutes of spending with nothing edited). |
| `ui/ticks.js` | 15 | The page's clock: the open session's header, once a second. |
| `ui/topbar.js` | 224 | Phone modal, notifications. |
| `ui/undo-view.js` | 55 | "Hoàn tác lượt cuối" (server/undo.mjs): in the session drawer, what undoing the last turn would do to each file, two clicks to do it, then what was done and "Tell Claude" (it doesn't know its files were put back otherwise). |