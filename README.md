# My Office (2D fork)

A local dashboard for your Claude Code sessions: one row per session, what it is doing now, how long it has been at
it, how full its context is, and approvals you can answer from the page.

This is a fork of [khanh020905/my-office](https://github.com/khanh020905/my-office) (MIT) with the 3D office removed:
the page is only the 2D list, which is light on memory and CPU (the 3D world was most of the original page's weight).

- **Sessions as a list**: working, needs you, resting; search with `/`; a click opens the session's drawer.
- **Approve from the page**: permission requests, Claude's questions and plans as cards (Allow, Always allow, Deny).
- **Your plan**: the 5-hour and weekly usage as two rings in the top bar, green to red with the percentage.
- **Safety nets**: stuck-loop breaker, two sessions on one file, undo the last turn, pinned notes that survive compaction.
- **Phone**: watch and approve from a phone on the same Wi-Fi (`--lan`).

> My Office is a community project. It is not made by, endorsed by or affiliated with Anthropic.

## Quick start

You need Node.js 20.9 or newer and Claude Code, on macOS, Linux or Windows. The machine panel (RAM, CPU, disk, dev
servers, cleanup) reads each system its own way; opening a session's IDE window and quitting apps are macOS only.

```bash
npm install -g claude-my-office   # (the command it installs is my-office)
my-office install --service   # adds the hooks to ~/.claude/settings.json and runs the office at login
my-office doctor              # checks Node, the server, every hook and the background service
```

Then open <http://localhost:4310>. To try it without installing: `npx claude-my-office start` (the hooks still need
`npx claude-my-office install`). An npm install keeps its data (settings, the phone PIN, the history vault) in `~/.my-office`,
so upgrading (`npm install -g claude-my-office@latest`) keeps it.

From the source instead (to change the code):

```bash
git clone https://github.com/khanh020905/my-office.git && cd my-office
npm install
node bin/cli.mjs install --service   # the same commands as `my-office …`, its data in data/
```

- `install` backs up `settings.json` before changing it and only adds My Office's own hooks. Running it again adds
  nothing twice.
- To remove everything: `my-office uninstall` (from the source: `node bin/cli.mjs uninstall`).

| Command | What it does |
| --- | --- |
| `install [--service] [--lan] [--no-approve] [--no-status] [--no-otel] [--no-otel-names]` | Adds three kinds of hooks: event hooks, approval hooks, and a status line that reports your plan's usage. Your own status line keeps running inside it. It also turns on Claude Code's own usage numbers (OpenTelemetry) for "What eats your plan", unless you already send them somewhere: see below. `--service` runs the office in the background from login: launchd on macOS, a systemd user service on Linux, the Startup folder on Windows (no admin needed). `--lan` lets a phone on the same Wi-Fi watch. `--no-approve` leaves out the approval hooks. `--no-status` leaves your status line alone. `--no-otel` leaves telemetry off; `--no-otel-names` keeps the names of your own MCP servers, skills and agents hidden ("custom"). |
| `uninstall` | Removes every My Office hook, the telemetry settings install added, and the background service, and keeps the rest of `settings.json`. |
| `doctor` | Checks each step and says what is missing and how to fix it. |
| `start [--lan]` | Runs the server in this terminal (no launchd). |
| `pin [--new]` | Shows the phone PIN; `--new` changes it and signs every phone out. |

- Restart after changing the code: `launchctl kickstart -k gui/$(id -u)/com.my-office` (macOS) or
  `systemctl --user restart my-office` (Linux). `my-office doctor` prints the right command for your system.
- Logs: `tail -f ~/.my-office/server.log` (from the source: `data/server.log`).

## What's inside

### Approve from the office

- **Permission requests** show up as cards: Allow, Always allow, Deny. Keys Y, N and A answer the top card.
- **Risky commands** are marked red, need two clicks and never offer "Always allow". That covers recursive deletes,
  force pushes, `curl | sh`, `sudo`, and anything mentioning prod.
- **Claude's questions and plans** are cards too, with every option, a free-text answer, and "approve" or "keep
  editing".
- **When this applies**: only while the page is open and visible, and for at most 45 seconds. Otherwise Claude Code
  asks as usual. You can turn this off in Settings.
- **Stuck loops get broken**: when a session runs the same thing and gets the same error three times in a row, its
  fourth try is blocked and Claude is told to change course (a synchronous `PreToolUse` hook that answers from memory;
  it gives up after 0.3 s, so with the office closed or busy the call simply goes ahead). The person's name tag turns
  red with "stuck", the team chat gets a card ("api-worker ran `npm test` and got the same error 3 times: try 4
  blocked") with **Stop** (at its next step; a run started from the office is stopped outright) and **Send a hint**
  (Claude reads it with its next step; once its turn is over, the hint carries the conversation on), and your phone
  gets a notification. It also points out compaction after compaction and spending for 10 minutes with no file edited,
  without blocking anything. Anything you type to the session forgives it. Settings → More: on or off, after how many
  failures, after how many minutes. Older installs: run `my-office install` once more to add the hook.
- **Two sessions on one file, a port someone holds**: when a session is about to edit a file another session edited in
  the last 20 minutes, its Claude is told first (read it again, don't overwrite the other's changes, ask if the work
  clashes) and the team chat says so. When a command can't have its port (`EADDRINUSE`, "Port 3000 is in use"), the
  chat says which server holds it and whose it is, and that session's Claude is told not to kill it. Both go through
  the stuck-loop hook, so they need nothing more installed.
- **Pinned notes that survive compaction**: a session's drawer has a **Pinned** tab for what that conversation should
  always keep in mind ("commit messages in Vietnamese", "never push without asking"). When Claude Code compacts a long
  conversation, what you said along the way can be summed up away; right after each compaction the office says the
  pinned notes again (the `SessionStart` hook, source `compact`), and the team chat says so. Kept by conversation in
  `data/pins.json`, 12 at most. Older installs: run `my-office install` once more to add the hook.
- **Calls auto mode refused**: when auto mode refuses a call (Claude Code's `PermissionDenied` hook), the team chat gets a
  card: who, the command, the reason auto mode gave. While an office page is open, Claude Code waits up to 40 s for
  **Let Claude retry** (Claude is told it may try again; the call goes through auto mode again) or **Keep it refused**;
  otherwise the refusal stands at once and the card keeps it on record. **Copy command** to run it yourself. Phones
  answer only when the Mac lets them approve. Older installs: run `my-office install` once more to add the hook.
- **Undo the last turn**: a resting session's drawer has **↶ Undo last turn**: the files Claude changed with its file
  tools (Edit, Write…) in its last turn, put back as they were before it, a file it created removed. The office keeps
  its own copies (the stuck-loop hook, which runs before every call, copies a file the first time a turn touches it,
  before Claude Code writes it), so it needs nothing from Claude Code's internals. What a terminal command changed
  (git, sed, a build) is not undone; a file changed again after the turn is left alone; what was there is kept in
  `data/undo/`. You see each file and what will happen first, two clicks to do it, then **Tell Claude**. From a phone
  only when work from phones is allowed.
- **"Fix it" when CI goes red**: when the latest CI run of a repository a session works in fails (read with `gh`), the
  team chat gets a card from that session with a link to the run and **Fix it**. It hands Claude the run: read the
  failing step's log, fix it, run that check locally, report back, and don't push. A session at work gets it as a note
  at its next step; a resting one carries its conversation on. The card says when the CI is green again. From a phone
  only when work from phones is allowed.

### Your plan and your Mac

- **The plan pill** shows your closest usage limit (5 hours, weekly, per model) and warns at 80% and 95%. With a second
  Claude Code login on the same machine (its own `CLAUDE_CONFIG_DIR`, such as `~/.claude-org2`), that account's limits
  show too, and its sessions wear a small badge with the account's name.
- **Several Claude accounts**: "Add a Claude account" in the plan card makes the account's folder and signs it in from
  the browser, no terminal needed. Hover an account to rename it, click "Use" to start new sessions on it, or drag it by
  its grip to set the order. With "Switch accounts when one runs out" on, new sessions move down that order when one
  runs out, and come back to the top one once it resets. It works through the editor's Claude Code extension (`claudeCode.claudeProcessWrapper`, set
  and removed by the office) or a shell alias the card shows; the accounts share history, settings and memory by links
  to `~/.claude`. macOS and Linux.
- **Moving an open session to another account**: click its person, then "Change account" and pick one. A session in
  the editor stops for a moment while it rests, and carries on with the new account, the same conversation, as soon as
  you write in it again (the office starts it there through the same script; its person waits at the desk meanwhile).
  A session in a terminal gets the command that resumes it there. With switching on, the sessions open on an account
  that runs out for a while (not a short rate limit) move by themselves too; a box under the switch turns that off.
- **Models: coordinator and subagents** (Settings → More): the model a Claude session runs on (Opus, Sonnet or the
  default) and the one its subagents run on (the same, Sonnet, Haiku or Opus), so a big task can be coordinated by Opus
  while Sonnet does the parts. "Always this model for subagents" also overrides the model Claude picks for one
  (`CLAUDE_CODE_SUBAGENT_MODEL_FORCE`). "Ask Claude to split big tasks among subagents" adds a short note to
  `~/.claude/CLAUDE.md`, taken out again when off. Written to `~/.claude/settings.json` (`model`,
  `env.CLAUDE_CODE_SUBAGENT_MODEL`); the other accounts share it by a link. Sessions started from then on use it.
- **My Office in the Mac's menu bar**: `install` also builds a small menu bar app (the building icon by the clock; it
  needs Xcode's command line tools): the number of sessions waiting for you, or at work, coloured when a plan's limit
  runs low; a click (or ⌃⌥O from any app) opens the same small panel as the editor's, a right-click opens the office;
  a notification when a session starts waiting for you or finishes. In the panel: ↑ ↓ pick a session, Enter brings
  its window up, Y / N answer the first request to approve, Esc closes it. The office starts it with itself.
  `--no-menubar` leaves it out.
- **My Office in the editor's side bar**: `install` also adds a small panel to each editor on the computer (Antigravity,
  VS Code, Cursor, Windsurf…: its icon in the activity bar): who is working, who waits for you with "Allow / Deny" right
  there, each tool's limit left; click a session to bring its window forward. It is the office's light page `/panel`
  so it costs next to nothing; `--no-panel` leaves the editors alone, `uninstall` takes it out.
- **Codex and Antigravity accounts too**: the plan card has a tab for each beside Claude's (as the phone window's two ways
  in), each with the account in use's tightest limit and a dot coloured like the bars; only the picked tool's accounts show. **Codex**: the account
  Codex is signed in with shows by itself, with its 5-hour and weekly usage (read by Codex's own `codex app-server`);
  "Add a Codex account" opens the ChatGPT sign-in page without signing the current one out; "Use" puts that account's
  sign-in into `~/.codex/auth.json` (the one there saved first: Codex rotates refresh tokens). A codex started after
  that uses it; the Codex panel in an editor keeps the old one until you reload the window, and the card says so.
  **Antigravity IDE**: each account with its quota per model family (the model picked in the agent panel first), as
  the IDE saved it in its state database (read with `sqlite3`, read-only). The IDE reads its account only as it starts,
  so with it open a switch waits for a quiet moment: when you close it, or while you are away (10 minutes without a key
  or the mouse, or a locked screen) with no Claude session in it at work and its own agent idle, the office closes and
  reopens it behind the app you had in front, every window, tab, unsaved file and Claude conversation back as it was
  (on a Mac; `OFFICE_AG_AWAY_MIN` sets the minutes). You can also have it done now. Adding one takes the IDE's sign-in
  out (kept, not signed out) and opens it to sign in again. With "Switch by itself when one runs out" on, both move to
  the next account with room; Antigravity already at 90% used, so the switch is done before you run out. The sign-ins
  stay in the office's own data folder (`data/codex`, `data/antigravity`, readable by you only). `OFFICE_AI_ACCOUNTS=0`
  turns both off.
- **The Mac pill** opens RAM, swap, CPU and disk. It says why the Mac is slow (memory spilled to disk, who holds the
  most) with one button to close every idle Claude session, and suggests the rest: stop a forgotten dev server, quit a
  heavy app, clear caches. Idle sessions can also be closed on a timer (off by default). Every action is checked first
  and logged.
- **Forgotten work** (in the Mac panel): every git worktree and main checkout of the repositories your sessions worked
  in (Claude Code's `.claude/worktrees` too) that still holds files not committed, commits not pushed or a stash, with
  its branch, size and when it last changed. **Open** it in your editor or terminal, **Give it to Claude** (a new
  conversation in that folder, the words ready to change), or **Delete** a worktree with nothing left in it, after a
  confirmation: never the main checkout, never one with work in it or a session open, and git (no `--force`) checks
  again right before.
- **Each session** has a context bar and a waste bin that fills up with context. It also shows its cost at API prices:
  with a subscription, this is not your bill.
- **The cache clock**: a cup of coffee on each resting desk whose steam fades as the session's prompt cache cools, gone
  once it is cold. While it is warm, writing to the session again is cheap; once cold, the next message reads the whole
  conversation again. The session's drawer says "Prompt cache still warm for ~23 minutes" or "gone cold: the next
  message re-reads ~180k tokens", and so does the chat's **To** ("warm ~23 min · cheap to continue"), so you can answer
  before it cools. It comes from the status line's `prompt_cache` (Claude Code 2.1.251 or later) and a resumed
  session's `SessionStart`; without them it is a guess from the end of the last turn and the documented lifetime (an
  hour on a subscription, five minutes on an API key), marked "(estimated)". Settings → More can tell your phone when
  a session waiting for your answer is five minutes from going cold (off by default).
- **What eats your plan** (the line at the bottom of the plan card, or ••• in the group chat, also on a phone): where
  Claude Code's usage goes, today or over 7 days. Who eats the most (MCP servers, skills, plugins, subagent types: "MCP
  github 34% · Skill pdf 12% · Subagent Explore 9%"), split by model and by source (main conversation, subagents,
  background work), a column a day, then by project and by session. Each figure is in USD at API prices and, once the
  plan's week is known, in ≈ % of the weekly limit. The numbers are Claude Code's own OpenTelemetry counters and
  events (code.claude.com/docs/en/monitoring-usage), sent by Claude Code to the office on this computer
  (`/v1/metrics`, `/v1/logs`, OTLP/HTTP JSON) and kept as daily sums in `data/otel/` for 30 days. `install` adds them
  to the `env` of `~/.claude/settings.json`, tagged `MY_OFFICE_OTEL` so `uninstall` takes out exactly those keys, and
  never if you already send telemetry somewhere (settings, your shell or a managed policy): it prints how to add the
  office as a second exporter to your OpenTelemetry Collector instead. Prompts stay hidden (`OTEL_LOG_USER_PROMPTS` is
  not set); `OTEL_LOG_TOOL_DETAILS=1` gives the real names of your own MCP servers and skills, and the tool input it
  adds to the events is dropped unread. A new Claude Code session picks the settings up; open ones keep their old ones.

### Small things

- English or Vietnamese (Settings → Display).
- **The list**: approvals sit on top with their buttons, then needs you, working and resting; tabs count and filter
  them, a search (`/`) finds one by name, project or branch. Each row: the conversation, what it is doing now in words
  of the work, its context (once it is filling up), its time and a subagent count; the branch only when it has
  uncommitted changes. A click opens the session.
- Open on your phone: same Wi-Fi, or anywhere through the Cloudflare tunnel (below), 6-digit PIN. Watching, plus
  approving if you turn on "Approve from a phone" on the Mac. Claude Code's own Remote Control (`/rc`) works too: the
  session's QR code in its drawer opens that conversation in the Claude app.
- **To**, over the chat's input: pick a conversation and write (or speak): that very conversation carries on. Resting in
  your editor, it is closed there first (safely, the way an account move does) and its tab takes it up again, with what
  you said on the phone, the next time you write there; one at work on the Mac waits. A live card under your message
  shows what Claude does (📖 reads, ✏️ edits, ▶ commands, an approval it waits for), then its answer comes, marked
  Claude, quoting you. Long messages fold with "Read more". Replying to one of Claude's answers writes to it too. Or pick **＋ a new conversation in a project** (the
  folders sessions have worked in, the latest first): Claude starts fresh there, and what you write next carries it on.
- **Prompt helper**, over the chat's input when you write to Claude: worked out in the page (nothing is sent), it points
  out what usually costs a round trip, one tip at a time once you stop typing: a screenshot with a word or two, "make it
  better" with no criterion, "this one" or "item 4" pointing at nothing, several jobs in one message, a message too
  short to act on. Its chips fix the draft (a sentence for the photo, "Criteria: ", the jobs numbered in the order
  they should be done); a tip you close stays closed for that message, and it never stops one going. "✨ Rewrite it
  clearly" asks Claude Code itself to rewrite it as Goal / Context / Done when (a small model, no tools, one turn, the
  text only, 20 an hour; it uses a little of your plan), with Undo. Off in Settings → More → Group chat.
- **Notifications on your phone** (Web Push, from `server/push.mjs` with nothing but `node:crypto`; shown by
  `public/sw.js`): Claude's answers, and an approval a phone's work needs while no office page is open, even with the
  phone locked. Turned on on each phone (⚙ → More → 📱) over the https address; on an iPhone, add My Office to the home
  screen first (Share → Add to Home Screen: it becomes an app, full screen, with its icon). The Mac's phone window counts
  the phones and sends a test. Subscriptions are posted only to the browsers' own push services.
- **History vault**: Claude Code deletes a conversation's transcript after 30 days (`cleanupPeriodDays`). The office
  keeps its words in `data/vault`: what you wrote and what Claude answered, its title, folder and times, from every
  account, read every 3 hours. No screenshots, commands or their output, so a month of transcripts (GBs) is a few MB.
  The chat's ••• → **History vault**: search everything that was said (with or without Vietnamese accents), read a
  conversation laid out, and copy `claude --resume <id>` while its transcript is still there. `OFFICE_VAULT=0` turns
  it off.
- **Weekly prompt report** (the vault's second tab, `?vault=report`): the last 7 days of what you wrote to Claude,
  looked at with the chat's prompt-helper rules: how many were clear enough for Claude to act at once (against the
  week before), the habits that cost a round trip (a screenshot with a word or two, "this one" with nothing to point
  at, "make it different" with no criterion, several jobs in one message, too short) with a tip for each, and real
  examples from the week. Worked out on this computer, no model involved; a line in the chat on Monday morning.
- **Give work** (📋 in the team chat, or @ a conversation and tap "Give work"): pick a conversation, carried on with
  its whole context as a new branch of it (the one open in your editor is left as it is), or a folder a session has
  worked in, for a new one. Type or speak (🎤, the browser's speech recognition: over https or on the Mac itself), and
  add up to 4 photos. The Mac runs it as `claude -p`; its commands ask for approval like any session's, and its answer
  comes back to the chat. From a phone only once "Give Claude work from a phone" is on, on the Mac; at most 3 at a
  time and 12 an hour.
- **Quick commands**: writing "To" a conversation, a row of chips over the input fills in a prompt you use often (run
  the tests, commit and push, deploy…). ✎ edits them (up to 12, kept on the Mac, the same on your phone), and
  **⭐ Save this** keeps what you are writing as one more in one tap, named after its first words.
- **Phone work as background sessions** (the phone window, under "Give Claude work from a phone"; off by default): each
  piece of work is a Claude Code background session (`claude --bg`, agent view, Claude Code 2.1.257 or newer) instead of
  `claude -p`. Its card still shows its steps, Stop and its answer, from the session's own hooks; an approval or a
  question waits on the phone and in the office until you answer it (no 45 s), and the card says how to carry it on at
  the Mac (`claude attach <id>`). It edits your working copy as before (no worktree of its own, nothing pushed by
  itself). A Claude Code without them, or a folder Claude Code doesn't trust yet (type `claude` there once in a
  terminal), runs it the old way and the chat says why.
- **Cut in while it works** ("Chen lời"): 💬 on a working card, or writing with "To" to a conversation that is busy (it
  asks first), puts your note ("fix the tests too", "wrong file, stop") into that session now, through its inbox socket
  (Claude Code's cross-session messaging, 2.1.224 or newer): Claude reads it right after the step it is on. Claude Code
  hands it over as a message from another session, so it never counts as your approval. A session that can't take one
  (an older Claude Code, one skipping every approval, settings that hold or refuse such messages) is said so in the chat,
  and the note goes as an ordinary message once it is done.
- On a phone the office lays itself out like an app, upright or held sideways: a compact top bar (plan, Mac, settings),
  the office filling the screen, and a tab bar (Office · Sessions · Activity · Approve · Chat, with counts) whose tabs
  open each panel as a full-screen sheet. A waiting approval floats just above the tabs with thumb-sized buttons.

## Privacy and safety

- **Everything stays on your Mac.** Hooks post to `127.0.0.1` in the background. If the office is not running, Claude
  Code carries on as normal. The stuck-loop hook is the one that waits for an answer, 0.3 s at most, and prints
  nothing when the office is closed or slow, so it never holds Claude Code up because of the office.
- **Secrets are masked.** Strings that look like passwords, tokens or API keys are masked before they are stored or
  shown.
- **Plan usage** is read the way the IDE's Usage panel reads it:
  - the office takes Claude Code's login from the Keychain each time, and never stores or logs it;
  - it asks Anthropic for the numbers every 2 minutes while a page is open;
  - the address it calls is undocumented and may change.
- **Network calls you can switch off**:

  | Call | When it happens | Off switch |
  | --- | --- | --- |
  | Plan usage | while a page is open | `OFFICE_USAGE=0` |
  | GitHub CI check, through your `gh` login | while a page is open | `OFFICE_CI=0` |
  | Translation into Vietnamese | only in Vietnamese mode | `OFFICE_TRANSLATE=0` |
  | Weather | only after you pick a city | leave the city empty |
  | Rewriting a message for Claude, through Claude Code (your plan) | only when you tap “✨ Rewrite it clearly” in the chat | Settings → More → Group chat |

- **Usage numbers** ("What eats your plan") go from Claude Code to `127.0.0.1` only: the receiver refuses anything
  from a web page, the Wi-Fi or the tunnel, reads JSON only (4 MB a request at most), and keeps daily sums of cost and
  tokens; e-mail addresses, prompts and commands are never stored.
- **Stop buttons** re-check the process ID **and its start time** just before acting. A new process that reused an
  old ID is never stopped by mistake. Every stop, cleanup and approval is written to `data/actions.log`.
- **Phones**:
  - The server listens on `127.0.0.1` only, until you turn on "Open on phones" in the phone window (or install with
    `--lan`). Then it also listens on the Mac's own network addresses (Wi-Fi, Ethernet, Tailscale), never on all of
    them, and turning it off closes them and cuts the phones off. "New PIN" there signs every phone out.
  - Phones need the PIN (a random 6 digits, or your own of 6 to 10 set in the phone window; not an easy one like
    000000 or 123456); five wrong tries lock that address for 15 minutes. "Remember this device" (ticked at first) keeps
    the phone signed in for a year, renewed as it's used; untick it on a borrowed phone and it lasts until the browser
    closes. A new PIN signs every phone out; a phone can change it too (⚙ → More → 📱), with the one it has now.
  - Phones watch. They approve only once you turn on "Approve from a phone" on the Mac (off by default; only the Mac
    can switch it): allow once or deny, answer a question or a plan; never "always", and a risky (red) command can
    only be denied from a phone. Each answer from a phone is logged with its address. Hooks come from the Mac alone.
  - Away from home (mobile data, another Wi-Fi): "Use it when you're out" in the phone window starts a Cloudflare quick
    tunnel (cloudflared, downloaded once; no account, no domain) and shows its https address and QR code. The address
    stays while it's on, across restarts of the office. Quick tunnels hold a stream's data back until it ends, so a page
    opened through one asks instead (`/api/live`, answered as soon as there is something new). What comes through it is from the internet whatever its
    address: the PIN only (no token links), an https-only cookie, and nothing but the PIN, chat messages, presence,
    approvals and work (these two only if allowed on the Mac) may be sent; hooks, stopping processes, accounts and the
    switches are refused. Off: cloudflared stops and the phones are cut off. A Tailscale network works too (the window
    shows its address).
  - While the tunnel is on and the Mac is on its charger, the office runs macOS's `caffeinate` so the Mac doesn't
    sleep (the display still turns off). On battery, or with the tunnel off, it sleeps as usual.
  - The page is plain HTTP, so only use `--lan` on a network you trust.

## Settings from the environment

| Variable | Default | What it does |
| --- | --- | --- |
| `OFFICE_PORT` | `4310` | The port. |
| `OFFICE_HOST` | `127.0.0.1` | The address to listen on (`install --lan` sets it for you). |
| `OFFICE_LANG` | `en` | The language until someone picks one in Settings. |
| `OFFICE_DATA_DIR` | `data/` | Where the office keeps its files. |
| `OFFICE_USAGE` | on | `0` stops reading your plan's usage. |
| `OFFICE_CI` | on | `0` stops checking CI runs with `gh`. |
| `OFFICE_TRANSLATE` | on | `0` leaves Claude's English descriptions untranslated in Vietnamese mode. |

## Development

```bash
npm install
npm run dev                   # Turbopack with hot reload: http://localhost:4310/?demo
npm run lint && npm run typecheck && npm test
npm run build && npm run test:e2e   # all of them (CI: the @smoke ones on every push, all of them split across runners in e2e-full.yml)
node scripts/build-demo.mjs   # the static online demo, into demo-site/
npm run smoke                 # starts the built server and checks it works on this system
```

| Part | Where | Built with |
| --- | --- | --- |
| The server | `server/` | plain Node.js |
| The page | `app/` and `src/components/` | Next.js (App Router) |
| The list | `src/office/` | plain JavaScript modules over the DOM |
| Every word on screen | `src/i18n/locales/` | one folder per language |

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) has the map. Read [CONTRIBUTING.md](CONTRIBUTING.md) before sending a pull
request.

## Credits

| What | From | Licence |
| --- | --- | --- |
| Ideas | agents-at-work | |
| Ideas, and the dangerous-command patterns | cubicle-crew | MIT |
| Ideas, and the RAM-growth and CPU rules | cc-reaper | Apache-2.0 |
| Libraries | [three.js](https://threejs.org), qrcode.js | MIT |
| Fonts | Be Vietnam Pro, JetBrains Mono | SIL Open Font License |
| Brand icons | [Simple Icons](https://simpleicons.org) | CC0 |
| Car models | [Kenney Car Kit](https://kenney.nl/assets/car-kit), see `public/assets/vehicles/README.md` | CC0 |
| Shop signs and liveries (Circle K, GS25, 7-Eleven, WinMart, Xanh SM, Grab, Shopee) | Wikimedia Commons, see `public/assets/brands/README.md`; the Shopee mark from Simple Icons | public domain as text logos; trademarks of their owners, not affiliated |
| The Mixue shop | drawn and modelled in code (`shop-mixue.js`): no artwork of the chain's; its tune is "Oh! Susanna" (Stephen Foster, 1848) | public domain melody; the name is its owner's trademark, not affiliated |
| The Highlands Coffee shop | drawn and modelled in code (`shop-highlands.js`): no artwork of the chain's | the name is its owner's trademark, not affiliated |
| The Thế Giới Di Động shop | drawn and modelled in code (`shop-tgdd.js`): no artwork of the chain's | the name is its owner's trademark, not affiliated |
| The Katinat shop | drawn and modelled in code (`shop-katinat.js`): no artwork of the chain's | the name is its owner's trademark, not affiliated |
| The Phúc Long shop | drawn and modelled in code (`shop-phuclong.js`): no artwork of the chain's | the name is its owner's trademark, not affiliated |
| The Cộng Cà Phê shop | drawn and modelled in code (`shop-cong.js`): no artwork of the chain's, only its generic retro look | the name and its logo are its owner's trademarks, not affiliated |
| The Long Châu pharmacy | drawn and modelled in code (`shop-longchau.js`): no artwork of the chain's | the names (Long Châu, FPT Retail) are their owner's trademarks, not affiliated |
| The Điện Máy Xanh shop | drawn and modelled in code (`shop-dmx.js`): no artwork of the chain's | the name is its owner's trademark, not affiliated |
| The Vietcombank ATM booth | drawn and modelled in code (`street-atm.js`): no artwork of the bank's | the name is its owner's trademark, not affiliated |
| The V-Green battery-swap cabinet | drawn and modelled in code (`street-ev.js`): no artwork of the company's | the name is its owner's trademark, not affiliated |
| Weather | [Open-Meteo](https://open-meteo.com) | |

## Licence

[MIT](LICENSE). The brand names and logos above stay their owners' trademarks; My Office is not affiliated with any of them.
