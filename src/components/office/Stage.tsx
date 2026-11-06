// The page's main area: the list of sessions and what floats over it.
import { getT } from '@/i18n/server';

export default async function Stage() {
  const t = await getT();
  return (
    <main className="stage-wrap">
      <div className="lite" id="lite" aria-label={t('ui.stage.lite')}></div>
      <div className="perm-stack" id="perm-stack" hidden aria-live="assertive"></div>
    </main>
  );
}
