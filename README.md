# My Office (2D fork)

A local dashboard for your Claude Code sessions: one row per session, what it is doing now, how long it has been at
it, how full its context is, and approvals you can answer from the page.

This is a fork of [khanh020905/my-office](https://github.com/khanh020905/my-office) (MIT) with the 3D office removed:
the page is only the 2D list, which is light on memory and CPU (the 3D world was most of the original page's weight).

- **Sessions as a list**: working, needs you, resting, always all groups at full width; search with `/`. Hold a resting row to close its session.
- **One conversation, one page**: a click opens the chat on a full page with the numbers and actions in a column beside it; a pencil renames it (the same `custom-title` line `/rename` writes). A message box under the chat sends a note to a working session or carries on a resting one, and a microphone dictates into it.
- **New session**: the `+` in the top bar opens your folders, one level at a time, with starred and recent ones, git projects marked and the chats that ran in each. Start a chat in any of them, or carry on one that ran there.
- **Archive**: every conversation Claude Code has kept, whatever its folder, in one searchable list with its full path (titles, folders and what was said), including those whose transcript Claude Code already deleted.
- **Approve from the page**: permission requests, Claude's questions and plans as cards (Allow, Always allow, Deny); a red badge in the top bar counts them and the cards float over any page.
- **Your plan**: the 5-hour and weekly usage as two rings in the top bar, green to red with the percentage.
- **Safety nets**: stuck-loop breaker, two sessions on one file, undo the last turn, pinned notes that survive compaction.
- **Phone**: watch and approve from a phone on the same Wi-Fi (`--lan`).
- **Desktop launchers (macOS)**: `scripts/open-office.sh` builds if needed, starts the server and opens the page; `scripts/stop-office.sh` stops it. Wrap them in a double-clickable app (`osacompile` with a `do shell script` line); the server log is `data/server.log`.

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
`npx claude-my-office install`). An npm install keeps its data (settings, the phone PIN) in `~/.my-office`,
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
| `install [--service] [--lan] [--no-approve] [--no-status]` | Adds three kinds of hooks: event hooks, approval hooks, and a status line that reports your plan's usage. Your own status line keeps running inside it. `--service` runs the office in the background from login: launchd on macOS, a systemd user service on Linux, the Startup folder on Windows (no admin needed). `--lan` lets a phone on the same Wi-Fi watch. `--no-approve` leaves out the approval hooks. `--no-status` leaves your status line alone. |
| `uninstall` | Removes every My Office hook, the telemetry settings an older install added, and the background service, and keeps the rest of `settings.json`. |
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
  it gives up after 0.3 s, so with the office closed or busy the call simply goes ahead). Its row in the list turns
  red and says what repeats ("ran `npm test` and got the same error 3 times"), and your phone gets a notification. It
  also points out compaction after compaction and spending for 10 minutes with no file edited,
  without blocking anything. Anything you type to the session forgives it. Settings → More: on or off, after how many
  failures, after how many minutes. Older installs: run `my-office install` once more to add the hook.
- **Two sessions on one file, a port someone holds**: when a session is about to edit a file another session edited in
  the last 20 minutes, its Claude is told first (read it again, don't overwrite the other's changes, ask if the work
  clashes). When a command can't have its port (`EADDRINUSE`, "Port 3000 is in use"), that session's Claude is told
  which server holds it and whose it is, and not to kill it. Both go through the stuck-loop hook, so they need nothing
  more installed.
- **Pinned notes that survive compaction**: a session's drawer has a **Pinned** tab for what that conversation should
  always keep in mind ("commit messages in Italian", "never push without asking"). When Claude Code compacts a long
  conversation, what you said along the way can be summed up away; right after each compaction the office says the
  pinned notes again (the `SessionStart` hook, source `compact`). Kept by conversation in
  `data/pins.json`, 12 at most. Older installs: run `my-office install` once more to add the hook.
- **Undo the last turn**: a resting session's drawer has **↶ Undo last turn**: the files Claude changed with its file
  tools (Edit, Write…) in its last turn, put back as they were before it, a file it created removed. The office keeps
  its own copies (the stuck-loop hook, which runs before every call, copies a file the first time a turn touches it,
  before Claude Code writes it), so it needs nothing from Claude Code's internals. What a terminal command changed
  (git, sed, a build) is not undone; a file changed again after the turn is left alone; what was there is kept in
  `data/undo/`. You see each file and what will happen first, two clicks to do it, then **Tell Claude**. From a phone
  only when work from phones is allowed.
### Your plan and your accounts

- **The plan rings** in the top bar show the 5-hour and the weekly usage (green to red, with the percentage), and a
  toast warns at 80% and 95%. A model's own weekly limit and a second Claude Code login on the same machine (its own
  `CLAUDE_CONFIG_DIR`, such as `~/.claude-org2`) are watched too.
- **Moving an open session to another account**: open its page, then "Change account" and pick one. A session in the
  editor stops for a moment while it rests, and carries on with the new account, the same conversation, as soon as you
  write in it again. A session in a terminal gets the command that resumes it there. macOS and Linux.
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
  there, the plan's limit left; click a session to bring its window forward. It is the office's light page `/panel`
  so it costs next to nothing; `--no-panel` leaves the editors alone, `uninstall` takes it out.
- **Each session** shows a context bar, and its cost at API prices on its page: with a subscription, this is not your
  bill.
- **The cache clock**: a session's page says "Prompt cache still warm for ~23 minutes" or "gone cold: the next message
  re-reads ~180k tokens", so you can write before it cools. While it is warm, writing to the session again is cheap;
  once cold, the next message reads the whole conversation again. It comes from the status line's `prompt_cache`
  (Claude Code 2.1.251 or later) and a resumed session's `SessionStart`; without them it is a guess from the end of the
  last turn and the documented lifetime (an hour on a subscription, five minutes on an API key), marked "(estimated)".

### Small things

- English or Italian (Settings → Display).
- **The list**: approvals sit on top with their buttons, then needs you, working and resting; tabs count and filter
  them, a search (`/`) finds one by name, project or branch. Each row: the conversation, what it is doing now in words
  of the work, its context (once it is filling up), its time and a subagent count; the branch only when it has
  uncommitted changes. A click opens the session.
- Open on your phone: same Wi-Fi, or anywhere through the Cloudflare tunnel (below), 6-digit PIN. Watching, plus
  approving if you turn on "Approve from a phone" on the Mac. Claude Code's own Remote Control (`/rc`) works too: the
  session's QR code on its page opens that conversation in the Claude app.
- **Writing to a session**: the box under a conversation on its page. While Claude works, your text goes in as a note it
  reads right after the step it is on (through its inbox socket: Claude Code's cross-session messaging, 2.1.224 or
  newer; Claude Code hands it over as a message from another session, so it never counts as your approval). Once the
  session rests, your message carries that very conversation on (as a new branch of it; the one open in your editor
  is left as it is). Type or speak (🎤, the browser's speech recognition: over https or on the Mac itself). A session
  that can't take a note (an older Claude Code, one skipping every approval, settings that hold or refuse such
  messages) or a terminal session at rest says so, and a note goes as an ordinary message once it is done. From a
  phone only once "Give Claude work from a phone" is on, on the Mac; at most 3 at a time and 12 an hour. The Mac runs
  it as `claude -p`; its commands ask for approval like any session's.
- **Notifications on your phone** (Web Push, from `server/push.mjs` with nothing but `node:crypto`; shown by
  `public/sw.js`): an approval that waits while no office page is open, even with the phone locked. Turned on on each phone (⚙ → More → 📱) over the https address; on an iPhone, add My Office to the home
  screen first (Share → Add to Home Screen: it becomes an app, full screen, with its icon). The Mac's phone window counts
  the phones and sends a test. Subscriptions are posted only to the browsers' own push services.
- **Phone work as background sessions** (the phone window, under "Give Claude work from a phone"; off by default): each
  piece of work is a Claude Code background session (`claude --bg`, agent view, Claude Code 2.1.257 or newer) instead of
  `claude -p`. An approval or a question waits on the phone and in the office until you answer it (no 45 s). It edits
  your working copy as before (no worktree of its own, nothing pushed by itself). A Claude Code without them, or a
  folder Claude Code doesn't trust yet (type `claude` there once in a terminal), runs it the old way.
- On a phone the page lays itself out like an app, upright or held sideways: a compact top bar (plan, settings), the
  list filling the screen, and a bottom bar with two tabs (Sessions, Approvals, with counts). Approvals open as a
  full-screen sheet, and a waiting one floats just above the tabs with thumb-sized buttons.

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
    address: the PIN only (no token links), an https-only cookie, and nothing but the PIN, presence,
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
| Libraries | qrcode.js | MIT |
| Fonts | Be Vietnam Pro, JetBrains Mono | SIL Open Font License |

## Licence

[MIT](LICENSE). My Office is not affiliated with any of the projects above.
