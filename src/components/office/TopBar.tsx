// The top bar: brand and clock, plan and Mac pills, chat, settings.
// Static markup: the office's code (src/office) finds these elements by id and fills them in.
import SettingsPanel from './SettingsPanel';
import { getT } from '@/i18n/server';

export default async function TopBar() {
  const t = await getT();
  return (
    <header className="topbar">
      <div className="tb-brand"><span className="logo" data-icon="logo"></span><span>My Office</span><span className="tb-clock" id="clock">--:--</span><span className="demo-chip" id="demo-chip" hidden>DEMO<span className="demo-more"> · {t('ui.topBar.sampleData')}</span></span></div>
      <div className="tb-actions">
        <div className="pop-wrap">
          <button id="btn-plan" className="tb-btn mac-pill plan-pill" type="button" data-level="normal" aria-expanded="false" aria-controls="pop-plan" hidden><i className="lvl"></i><span className="mp-label">{t('ui.topBar.plan')}</span><span className="mp-val" id="plan-lite"></span><span className="mp-val" id="plan-mini">{t('ui.topBar.reading')}</span><span className="mp-bar"><b id="plan-bar"></b></span></button>
          <div className="pop pop-plan" id="pop-plan" hidden role="dialog" aria-label={t('ui.topBar.planLimits')}>
            <div className="plan-card" id="plan-card">
              <span className="hl-head"><b id="plan-title">{t('ui.topBar.planLimits')}</b><span className="pl-at" id="plan-at"></span></span>
              {/* Claude, Codex, Antigravity as tabs when there is more than Claude (src/office/ui/ai-accounts.js) */}
              <div className="pm-tabs plan-tabs" id="plan-tabs" role="tablist" hidden></div>
              <div className="plan-pane" id="plan-pane-claude" role="tabpanel">
                <span className="plan-acct" id="plan-acct" hidden></span>
                <div className="plan-rows" id="plan-rows"></div>
                <div className="plan-add" id="plan-add"></div>
                <p className="plan-empty" id="plan-empty">{t('ui.topBar.planEmpty')}</p>
                <button className="plan-burn" id="plan-burn" type="button" hidden></button>
                <p className="plan-foot">{t('ui.topBar.planFoot')}</p>
              </div>
              <div className="plan-ai" id="plan-ai" role="tabpanel" hidden></div>
            </div>
          </div>
        </div>
        <button id="btn-mac" className="tb-btn mac-pill" type="button" data-level="normal" title={t('ui.topBar.macTitle')}><i className="lvl"></i><span className="mp-label">{t('ui.topBar.mac')}</span><span className="mp-val" id="mac-mini">{t('ui.topBar.measuring')}</span><span className="mp-bar"><b id="ml-ram"></b></span><i className="mp-tip" id="mac-tip" hidden></i></button>
        <button id="btn-chat" className="tb-btn tb-chat" type="button" aria-pressed="false" title={t('chat.openTitle')}><span data-icon="chat"></span><span className="lbl">{t('chat.open')}</span><i className="tb-badge" id="chat-badge" hidden></i></button>
        <div className="pop-wrap">
          <button id="btn-look" className="tb-btn" type="button" aria-expanded="false" aria-controls="pop-look" title={t('ui.topBar.settingsTitle')}><span data-icon="gear"></span><span className="lbl">{t('ui.topBar.settings')}</span></button>
          <SettingsPanel />
        </div>
      </div>
    </header>
  );
}
