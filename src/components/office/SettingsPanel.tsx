// Settings: two tabs. Display (language) and More (phone, alerts, behaviour, models). Static markup:
// src/office/ui/settings.js drives it; ids and data-* stay as the office's code expects them.
import { LANGS } from '@/i18n/index.js';
import { getT } from '@/i18n/server';

const LOOP_N = [2, 3, 4, 5], LOOP_MIN = [5, 10, 20, 30];   // (the server's choices: server/loops.mjs)
const MODEL_MAIN = ['opus', 'sonnet', ''], MODEL_SUB = ['', 'sonnet', 'haiku', 'opus'];   // (server/models.mjs: '' = the default, the same as the session)

export default async function SettingsPanel() {
  const t = await getT();
  const toggle = (k: string, on: boolean) => (
    <button key={k} type="button" className="tgl" data-tgl={k} role="switch" aria-checked={on ? 'true' : 'false'}><span>{t(`ui.topBar.toggles.${k}`)}</span><i></i></button>
  );
  return (
    <div className="pop pop-settings" id="pop-look" hidden role="dialog" aria-label={t('ui.topBar.settings')}>
      <div className="st-head">
        <b>{t('ui.topBar.settings')}</b>
        <button type="button" className="st-close" id="st-close" aria-label={t('common.close')}><span data-icon="x"></span></button>
      </div>
      <div className="st-tabs" role="tablist">
        {(['display', 'more'] as const).map((k, i) => (
          <button key={k} type="button" role="tab" id={`st-tab-${k}`} aria-controls={`st-panel-${k}`} aria-selected={i === 0 ? 'true' : 'false'} data-st-tab={k}>{t(`settings.tabs.${k}`)}</button>
        ))}
      </div>

      <div className="st-body">
        <section className="st-panel" id="st-panel-display" role="tabpanel" aria-labelledby="st-tab-display" data-st-panel="display">
          <h3>{t('settings.language')}</h3>
          <div className="st-cards st-cards--2">
            {Object.entries(LANGS).map(([code, l]) => (
              <button key={code} type="button" className="scene st-lang" lang={code} data-lang={code} aria-pressed={code === t.lang ? 'true' : 'false'}>
                <span className="st-code">{code.toUpperCase()}</span><b>{l.name}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="st-panel" id="st-panel-more" role="tabpanel" aria-labelledby="st-tab-more" data-st-panel="more" hidden>
          <div className="st-group">
          <h3>{t('settings.notify')}</h3>
          <div className="st-acts">
            <button id="btn-phone" className="st-act" type="button" hidden><span data-icon="phone"></span><b>{t('ui.topBar.phone')}</b><small>{t('settings.phoneNote')}</small></button>
            <button id="btn-bell" className="st-act" type="button" aria-pressed="false" hidden><span data-icon="bell"></span><b>{t('ui.topBar.bell')}</b><small>{t('settings.bellNote')}</small><i className="badge" id="bell-dot" hidden></i></button>
          </div>
          </div>
          <h3>{t('settings.behaviour')}</h3>
          <div className="pop-toggles">{toggle('sound', true)}{toggle('perm', true)}</div>
          {/* the models of a session and its subagents (src/office/ui/models.js fills it in from the server; on the Mac only) */}
          <div className="st-loop" id="st-models" hidden>
            <h3>{t('settings.models.title')}</h3>
            <p className="pop-note">{t('settings.models.note')}</p>
            <div className="st-loop-row"><span>{t('settings.models.main')}</span>
              <div className="seg">{MODEL_MAIN.map((m) => <button key={m || 'default'} type="button" data-model-main={m} aria-pressed="false">{t(`settings.models.opt.${m || 'default'}`)}</button>)}</div></div>
            <div className="st-loop-row"><span>{t('settings.models.sub')}</span>
              <div className="seg">{MODEL_SUB.map((m) => <button key={m || 'same'} type="button" data-model-sub={m} aria-pressed="false">{t(`settings.models.opt.${m || 'same'}`)}</button>)}</div></div>
            <p className="pop-note" id="st-models-other" hidden></p>
            <div className="pop-toggles">
              <button type="button" className="tgl" data-model-force="" role="switch" aria-checked="false"><span>{t('settings.models.force')}</span><i></i></button>
              <button type="button" className="tgl" data-model-split="" role="switch" aria-checked="false"><span>{t('settings.models.split')}</span><i></i></button>
            </div>
            <p className="pop-note">{t('settings.models.splitNote')}</p>
          </div>
          {/* the stuck-loop breaker (src/office/ui/stuck.js fills it in from the server; hidden in the demo) */}
          <div className="st-loop" id="st-loop" hidden>
            <h3>{t('settings.loop.title')}</h3>
            <div className="pop-toggles"><button type="button" className="tgl" data-loop-tgl="" role="switch" aria-checked="true"><span>{t('settings.loop.on')}</span><i></i></button></div>
            <p className="pop-note">{t('settings.loop.note')}</p>
            <div className="st-loop-row"><span>{t('settings.loop.after')}</span>
              <div className="seg">{LOOP_N.map((n) => <button key={n} type="button" data-loop-n={n} aria-pressed={n === 3 ? 'true' : 'false'}>{t('settings.loop.tries', { n })}</button>)}</div></div>
            <div className="st-loop-row"><span>{t('settings.loop.costAfter')}</span>
              <div className="seg">{LOOP_MIN.map((n) => <button key={n} type="button" data-loop-min={n} aria-pressed={n === 10 ? 'true' : 'false'}>{t('settings.loop.mins', { n })}</button>)}</div></div>
            <p className="pop-note st-loop-install" id="st-loop-install" hidden>{t('settings.loop.install')}</p>
          </div>
          {/* approving from the Mac's notifications (src/office/ui/mac-approve.js fills it in from the server; hidden in the demo) */}
          <div className="st-loop" id="st-macapprove" hidden>
            <h3>{t('settings.macApprove.title')}</h3>
            <div className="pop-toggles"><button type="button" className="tgl" data-mac-tgl="" role="switch" aria-checked="true"><span>{t('settings.macApprove.on')}</span><i></i></button></div>
            <p className="pop-note">{t('settings.macApprove.note')}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
