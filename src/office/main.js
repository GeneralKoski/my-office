// Boots the office: the 2D list of sessions. Every module's setup() runs once, in this order: the basics, the
// sessions and the top bar, then the settings, the live connection (or the demo).
import * as coreEnv from './core/env.js';
import * as uiIcons from './ui/icons.js';
import * as uiLite from './ui/lite.js';
import * as uiActivity from './ui/activity.js';
import * as uiSessionDrawer from './ui/session-drawer.js';
import * as uiComposer from './ui/composer.js';
import * as uiArchive from './ui/archive.js';
import * as uiFolders from './ui/folders.js';
import * as uiPlan from './ui/plan.js';
import * as uiTopbar from './ui/topbar.js';
import * as uiSettings from './ui/settings.js';
import * as uiStuck from './ui/stuck.js';
import * as uiMacApprove from './ui/mac-approve.js';
import * as uiModels from './ui/models.js';
import * as uiCacheWords from './ui/cache-words.js';
import * as netLive from './net/live.js';
import * as uiTicks from './ui/ticks.js';
import * as lifeYourTurn from './life/your-turn.js';
import * as audioSfx from './audio/sfx.js';
import * as uiPermissions from './ui/permissions.js';
import * as uiPhone from './ui/phone.js';
import * as uiNotify from './ui/notify.js';
import * as demoDemo from './demo/demo.js';

const MODULES = [
  coreEnv,
  uiIcons,
  uiLite,
  uiActivity,
  uiSessionDrawer,
  uiComposer,
  uiArchive,
  uiFolders,
  uiPlan,
  uiTopbar,
  uiSettings,
  uiStuck,
  uiMacApprove,
  uiModels,
  uiCacheWords,
  netLive,
  lifeYourTurn,
  audioSfx,
  uiPermissions,
  uiPhone,
  uiNotify,
  demoDemo,
  uiTicks,
];

let started = false;
export function startOffice() {
  if (started) return;
  started = true;
  for (const m of MODULES) m.setup();
  demoDemo.start(); uiTopbar.renderBell();
  uiSettings.syncToggles(); uiLite.showLite();
}
