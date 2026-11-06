// New session: pick a folder on this computer, then start a conversation there or carry on one. Static markup:
// src/office/ui/folders.js fills it in.
import { getT } from '@/i18n/server';

export default async function FoldersPage() {
  const t = await getT();
  return (
    <section className="folders" id="folders" hidden aria-label={t('folders.title')}>
      <header className="fo-head">
        <button className="icon-btn fo-back" id="fo-close" type="button" aria-label={t('folders.back')} title={t('folders.back')}><span data-icon="back"></span></button>
        <h2>{t('folders.title')}</h2>
      </header>
      <div className="fo-body">
        <aside className="fo-rail" id="fo-rail" aria-label={t('folders.computer')}></aside>
        <div className="fo-main">
          <div className="fo-bar">
            <nav className="fo-crumbs" id="fo-crumbs" aria-label="path"></nav>
            <input className="fo-filter" id="fo-q" type="search" placeholder={t('folders.filter')} aria-label={t('folders.filter')} autoComplete="off" />
            <label className="fo-hid"><input type="checkbox" id="fo-hidden" /> <span>{t('folders.hidden')}</span></label>
          </div>
          <div className="fo-cols">
            <div className="fo-scroll" id="fo-scroll"><div className="fo-grid" id="fo-grid"></div></div>
            <aside className="fo-here" id="fo-here"></aside>
          </div>
        </div>
      </div>
    </section>
  );
}
