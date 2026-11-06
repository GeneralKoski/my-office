// The top bar: brand, the plan's rings, settings.
// Static markup: the office's code (src/office) finds these elements by id and fills them in.
import SettingsPanel from './SettingsPanel';
import { getT } from '@/i18n/server';

export default async function TopBar() {
  const t = await getT();
  return (
    <header className="topbar">
      <div className="tb-brand"><span className="logo" data-icon="logo"></span><span>My Office</span><span className="demo-chip" id="demo-chip" hidden>DEMO<span className="demo-more"> · {t('ui.topBar.sampleData')}</span></span></div>
      <div className="tb-actions">
        <button id="btn-plan" className="tb-btn mac-pill plan-pill" type="button" hidden><span className="mp-val" id="plan-lite"></span></button>
        <button id="btn-approvals" className="tb-btn tb-pending" type="button" hidden title={t('ui.topBar.approvals')}><span data-icon="alert"></span><b id="approvals-n">0</b></button>
        <button id="btn-archive" className="tb-btn" type="button" aria-pressed="false" title={t('archive.open')}><span data-icon="book"></span><span className="lbl">{t('archive.open')}</span></button>
        <div className="pop-wrap">
          <button id="btn-look" className="tb-btn" type="button" aria-expanded="false" aria-controls="pop-look" title={t('ui.topBar.settingsTitle')}><span data-icon="gear"></span><span className="lbl">{t('ui.topBar.settings')}</span></button>
          <SettingsPanel />
        </div>
      </div>
    </header>
  );
}
