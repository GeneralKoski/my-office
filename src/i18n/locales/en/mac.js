// The plan's limits and accounts (src/office/ui/plan.js, session-account.js) and the Mac panel (src/panel/mac.js).
// The cleanup tips themselves are written by the server (server.sys.*).
export default {
  add: {
    copy: 'Copy',
    copied: 'Copied',
  },

  plan: {
    fiveHour: '5 h',
    week: 'Week',
    at: 'at {time}',
    date: '{day} {m}/{d} {time}',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    unread: "can't read it yet",
    reading: 'reading…',
    // another Claude Code login on this machine (its own config folder, e.g. ~/.claude-org2): its name is the folder's
    otherAccount: 'Account {name}',
    loading: 'Reading the usage limits from your Claude Code account…',
    resets: 'resets {when}',
    warn: 'Claude plan: {pct}% of the {label} limit used{reset}.',
    warnReset: ', resets {when}',
    mainAccount: 'Main account',
    out: 'Out till {when}',
    moved: '{from} ran out: {n} open session(s) moved to {to} ({names}). Write in a chat to go on.',
    switched: '{from} is out of usage (back {when}). New Claude Code sessions now use {to}.',
    switchedBack: 'New Claude Code sessions are back on {to}.',
  },
  action: {
    working: 'Working…',
    sure: 'Sure? {verb}',
    sureForce: 'Sure? Force it now',
    forceQuit: 'Force quit',
    forceStop: 'Force stop',
    done: 'Done.',
    failed: "Couldn't do that.",
    unreachable: "Couldn't reach My Office.",
  },
  verb: {
    stop: 'Stop',
    quit: 'Quit',
    clean: 'Clean up',
  },
  measuring: 'Measuring RAM, CPU and disk…',
  meter: {
    disk: 'Disk',
  },
  tips: {
    gainRam: '+{size} RAM',
  },
  verdict: {
    critical: 'Badly short of RAM — {swap} has spilled onto the disk (swap), that is why your {mac} is slow',
    swap: 'Short of RAM — {swap} has spilled onto the disk (swap), that is why your {mac} is slow',
    squeeze: 'Short of RAM — macOS is compressing memory to make room, things may feel slow',
    swapLeft: 'RAM is fine now, but {swap} of swap is still on the disk — macOS clears it slowly, a restart clears it at once',
    disk: 'The disk is almost full — only {free} free',
    cpu: 'The CPU is {pct}% busy — your {mac} may be slow and warm',
    ok: 'All good — RAM {pct}%, nothing to do',
    who: 'Holding the most RAM: {list}',
    closeIdle: { one: 'Close {n} idle Claude session · +{size}', other: 'Close {n} idle Claude sessions · +{size}' },
    closeIdleSure: { one: 'Sure? Close {n} idle session', other: 'Sure? Close {n} idle sessions' },
  },
  held: {
    sessions: 'Claude sessions',
    dev: 'Dev servers',
  },
};
