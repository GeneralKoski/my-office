// The page markup (src/components/office), one group per component. The office's code fills most of it in later.
export default {
  meta: {
    title: 'My Office: a 3D office for your Claude Code sessions',
    description: 'Each Claude Code session is a character at a desk in a 3D office. Approve permissions, watch RAM and plan limits, and see what every agent is doing. Free and open source.',
  },
  topBar: {
    sampleData: 'sample data',
    approvals: 'Waiting for your OK',
    settings: 'Settings',
    settingsTitle: 'Settings: office, scenery, characters, notifications, open on your phone',
    phone: 'Open on your phone',
    bell: 'Notify me when approval is needed',
    toggles: {
      sound: 'Sound',
      perm: 'Approve permissions right in the office',
    },
  },
  macDrawer: {
    refresh: 'Refresh',
  },
  // the tab bar and sheets on a phone (ui/phone.js)
  phone: {
    tabs: 'Sections',
    sessions: 'Sessions',
    approve: 'Approve',
    approveEmpty: 'Nothing waiting for you',
    approveEmptySub: 'When a session needs your OK, its card shows here and floats just above the bottom bar.',
  },
  phoneModal: {
    title: 'Open on your phone',
  },
  sessionDrawer: {
    label: 'Session details',
    read: 'files read',
    edit: 'edits',
    cmd: 'commands',
    time: 'current task',
    ctx: 'context',
    cost: 'API cost ≈',
    chat: 'Conversation',
    subs: 'Subagents',
    activity: 'Activity',
  },
  stage: {
    lite: 'Sessions as a list',
  },
};
