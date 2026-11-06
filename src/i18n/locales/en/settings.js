export default {
  language: 'Language',
  switchingLang: 'Switching language…',
  tabs: { display: 'Display', more: 'More' },
  notify: 'Phone and alerts',
  phoneNote: 'Approve and watch from your phone',
  bellNote: 'A desktop alert when Claude needs you',
  behaviour: 'Behaviour',
  // Settings → More: the models of a session and its subagents (ui/models.js, server/models.mjs)
  models: {
    title: 'Models: coordinator and subagents',
    note: 'A big task can be split among subagents: the session coordinates on one model, its subagents work on another (Sonnet costs less than Opus). For Claude sessions started from now on, on every account.',
    main: 'The session (coordinator)', sub: 'Subagents',
    opt: { opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku', default: 'Default', same: 'Same' },
    force: 'Always this model for subagents (even when Claude picks another)',
    split: 'Ask Claude to split big tasks among subagents',
    splitNote: 'A short note in ~/.claude/CLAUDE.md, taken out again when this is off.',
    other: 'Now: {model} (set by hand)',
    saved: 'Saved. Claude sessions started from now on use it; the ones open now keep their model.',
    readOnly: "~/.claude/settings.json can't be read here (it may have comments): set the model there by hand.",
  },
  // Settings → More: the stuck-loop breaker (server/loops.mjs)
  // Settings → More: approve right from the Mac's notifications (ui/mac-approve.js, server/mac-hold.mjs)
  macApprove: {
    title: "Approve from the Mac's notifications",
    on: "Approve from the Mac's notifications",
    note: "While you are at the Mac (a key or the mouse touched lately) and the menu bar icon is running, a request from Claude is held for up to 20 seconds so you can press Allow / Deny on its notification. A risky command only gets Deny. Turn it off and Claude asks in the IDE straight away, as before; so it does when you are away.",
  },
  loop: {
    title: 'Stuck loops',
    on: 'Break stuck loops',
    note: 'When a session runs the same thing and gets the same error again and again, its next try is blocked and Claude is told to change course; a card in the chat lets you stop it or send a hint. It also points out compaction after compaction, and spending with no file edited.',
    after: 'Block after', tries: { one: '{n} failure', other: '{n} failures' },
    costAfter: 'Spending with no file edited for', mins: '{n} min',
    install: 'Run `node bin/cli.mjs install` once more so Claude Code checks with the office before each step.',
  },
};
