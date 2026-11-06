// What the server says about a stuck session, work given to Claude and a note sent to a working session (server/index.mjs).
export default {
  loop: {
    repeat: '{name} ran {label} and got the same error {n} times: try {next} blocked',
    compact: '{name} compacted its memory {n} times in {mins} min: it may be going round in circles',
    cost: '{name} spent about {usd} in {mins} min without editing a file',
  },
  steer: {
    notBusy: '{name} isn’t in the middle of anything now: send it as a normal message.',
  },
  task: {
    notAllowed: 'Giving work from a phone isn’t allowed yet. On the Mac: 📱 Phone → turn on “Give Claude work from a phone”.',
    noDir: 'That folder or conversation isn’t on the Mac.',
    failed: 'The work in {folder} isn’t done: {error}',
    doneEmpty: 'Done, boss ✅',
    stopped: '⏹ Stopped, as you asked.',
    threadBusy: '{name} is still on your last message: wait for the answer, then write again',
    macBusy: '{name} is working on the Mac. Wait until it is done, then write from the phone.',
    macTerminal: '{name} is open in a terminal: exit it there (/exit) and write again, and the phone carries on this very conversation.',
    why: { busy: '3 are running already, wait for one to finish', tooMany: 'a lot of work given this hour, try later', noClaude: 'Claude Code isn’t on the Mac', noDir: 'the folder is gone', empty: 'nothing written' },
  },
};
