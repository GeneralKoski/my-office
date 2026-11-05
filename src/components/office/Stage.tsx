// The page's main area: the list of sessions and what floats over it.
import { getT } from '@/i18n/server';

export default async function Stage() {
  const t = await getT();
  return (
    <main className="stage-wrap" id="stage-wrap">
      <div id="stage"></div>
      <div className="lite" id="lite" aria-label={t('ui.stage.lite')}></div>
      <div className="perm-stack" id="perm-stack" hidden aria-live="assertive"></div>
      <div className="empty" id="empty" hidden><b>{t('ui.stage.emptyTitle')}</b><span className="muted">{t('ui.stage.emptyText')}</span></div>
    </main>
  );
}
