// The archive: every conversation, searched and read. Static markup: src/office/ui/archive.js fills it in.
import { getT } from '@/i18n/server';

export default async function ArchivePage() {
  const t = await getT();
  return (
    <section className="archive" id="archive" hidden aria-label={t('archive.title')}>
      <div className="ar-list-view" id="ar-list-view">
        <header className="ar-head">
          <button className="icon-btn ar-back" id="ar-close" type="button" aria-label={t('archive.back')} title={t('archive.back')}><span data-icon="back"></span></button>
          <h2>{t('archive.title')}</h2>
          <span className="ar-count" id="ar-count"></span>
        </header>
        <div className="ar-bar"><input className="ar-search" id="ar-q" type="search" placeholder={t('archive.search')} aria-label={t('archive.search')} autoComplete="off" /></div>
        <div className="ar-scroll" id="ar-scroll"></div>
      </div>
      <div className="ar-reader" id="ar-reader" hidden></div>
    </section>
  );
}
