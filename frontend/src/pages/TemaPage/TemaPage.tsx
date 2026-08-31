import { BookOpen, Tv } from 'lucide-react';

import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import { PageHero, PageShell } from '@/components/PageShell';
import { useI18n } from '@/contexts/I18nContext';

const ANIME_LINKS = [
  { label: 'Crunchyroll', url: 'https://www.crunchyroll.com/it/series/GR751KNZY/attack-on-titan' },
  { label: 'Netflix', url: 'https://www.netflix.com/it-en/title/70299043' },
  { label: 'Disney+', url: 'https://www.disneyplus.com/' },
] as const;

const MANGA_LINKS = [
  { label: 'K MANGA (Kodansha)', url: 'https://kmanga.kodansha.com/title/10136/episode/312468' },
  { label: 'Azuki', url: 'https://www.azuki.co/series/attack-on-titan' },
] as const;

/** Explains the wedding's Attack on Titan theme: crest, style, mission, and where to watch it. */
export function TemaPage() {
  const { t } = useI18n();

  return (
    <PageShell>
      <PageHero eyebrow={t('tema.eyebrow')} title={t('tema.title')} subtitle={t('tema.subtitle')} />

      <section className="obw-card obw-stack-center">
        <MissionDocumentSeal />
        <h2 className="obw-display obw-display--sm">{t('tema.crestTitle')}</h2>
        <p className="obw-body obw-body--flush">{t('tema.crestBody')}</p>
      </section>

      <section className="obw-card">
        <h2 className="obw-display obw-display--sm">{t('tema.styleTitle')}</h2>
        <p className="obw-body obw-body--flush">{t('tema.styleBody')}</p>
      </section>

      <section className="obw-card">
        <h2 className="obw-display obw-display--sm">{t('tema.missionTitle')}</h2>
        <p className="obw-body obw-body--flush">{t('tema.missionBody')}</p>
      </section>

      <section className="obw-card">
        <h2 className="obw-display obw-display--sm">{t('tema.watchTitle')}</h2>
        <p className="obw-body">{t('tema.watchIntro')}</p>

        <p className="obw-kicker">{t('tema.watchAnimeLabel')}</p>
        <div className="obw-tag-row obw-tag-row--start">
          {ANIME_LINKS.map((link) => (
            <a key={link.label} className="obw-btn obw-btn--secondary" href={link.url} target="_blank" rel="noreferrer">
              <Tv size={14} aria-hidden />
              {link.label}
            </a>
          ))}
        </div>

        <p className="obw-kicker">{t('tema.watchMangaLabel')}</p>
        <div className="obw-tag-row obw-tag-row--start">
          {MANGA_LINKS.map((link) => (
            <a key={link.label} className="obw-btn obw-btn--secondary" href={link.url} target="_blank" rel="noreferrer">
              <BookOpen size={14} aria-hidden />
              {link.label}
            </a>
          ))}
        </div>

        <p className="obw-body obw-body--flush">{t('tema.watchNote')}</p>
      </section>
    </PageShell>
  );
}
