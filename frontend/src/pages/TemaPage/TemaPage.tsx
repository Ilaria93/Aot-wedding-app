import { BookOpen, Tv } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { HeroParticleField } from '@/components/MissionDocumentHero/HeroParticleField';
import { MissionDocumentSeal } from '@/components/MissionDocumentHero/MissionDocumentSeal';
import { useI18n } from '@/contexts/I18nContext';
// The home's section/card look lives here; imported so a direct /tema load has it too.
import '@/pages/HomePage/styles/HomePage.scss';
import './styles/TemaPage.scss';

// Where to watch/read in Italy (checked October 2026); bodies under tema.watch<Id>Body.
const ANIME_LINKS = [
  { id: 'Crunchyroll', label: 'Crunchyroll', url: 'https://www.crunchyroll.com/it/series/GR751KNZY/attack-on-titan' },
  { id: 'Netflix', label: 'Netflix', url: 'https://www.netflix.com/it/title/70299043' },
  { id: 'Prime', label: 'Prime Video', url: 'https://www.primevideo.com/-/it/detail/LAttacco-dei-Giganti/0J3OTJAN6KC2NV157JXI5G0TCD' },
] as const;

const MANGA_LINKS = [
  { id: 'Zipaki', label: 'Zipaki', url: 'https://www.zipaki.com/serie/l-attacco-dei-giganti' },
] as const;

// Term/description pairs, rendered as a list; keys map to tema.<prefix><Id>Term/Body.
const SYMBOL_IDS = ['Walls', 'Petals', 'Seal', 'Reports'] as const;
const GLOSSARY_IDS = ['Heart', 'Corps', 'Beyond', 'Recon', 'Report', 'Enlist', 'Operation'] as const;

type TemaSectionProps = {
  title: string;
  children: ReactNode;
};

/** One theme topic laid out like a home section: script title, gold rule, dark card. */
function TemaSection({ title, children }: TemaSectionProps) {
  return (
    <section className="obw-section obw-fade-up">
      <div className="obw-container obw-container--narrow obw-stack-center">
        <h2 className="obw-display obw-display--lg">{title}</h2>
        <div className="obw-rule obw-rule--center" aria-hidden="true" />
        <div className="obw-card obw-card--dark landing-box obw-stack-center">{children}</div>
      </div>
    </section>
  );
}

/**
 * Explains the wedding's Attack on Titan theme: the series in brief, why it's
 * ours, crest, symbols, glossary and where to watch/read it in Italy. Reuses the home's look (.landing-page): petals, a fixed
 * veil over the artwork and portal-style cards.
 */
export function TemaPage() {
  const { t } = useI18n();

  return (
    <div className="landing-page tema-page">
      {/* Short page, no scroll-driven fade: the veil sits at a fixed strength. */}
      <div className="landing-veil" style={{ '--veil': 0.6 } as CSSProperties} aria-hidden />
      <HeroParticleField />
      <div className="landing-page__body">
        <section className="obw-section obw-fade-up">
          <div className="obw-container obw-container--narrow obw-stack-center">
            <h1 className="obw-display obw-display--lg">{t('tema.title')}</h1>
            <div className="obw-rule obw-rule--center" aria-hidden="true" />
            <div className="obw-card obw-card--dark landing-box">
              <p className="obw-body obw-body--flush">{t('tema.subtitle')}</p>
            </div>
          </div>
        </section>

        <TemaSection title={t('tema.aotTitle')}>
          <p className="obw-kicker">{t('tema.aotLead')}</p>
          <p className="obw-body obw-body--flush">{t('tema.aotBody')}</p>
          <p className="obw-body obw-body--flush">{t('tema.aotBody2')}</p>
          <p className="obw-body obw-body--flush">{t('tema.aotBody3')}</p>
          <p className="tema-page__note">{t('tema.aotFacts')}</p>
        </TemaSection>

        <TemaSection title={t('tema.whyTitle')}>
          <p className="obw-body obw-body--flush">{t('tema.whyBody')}</p>
          <p className="obw-body obw-body--flush">{t('tema.whyBody2')}</p>
          <div className="tema-page__favourites">
            <div className="tema-page__favourite">
              <p className="obw-kicker">{t('tema.whyIlariaLabel')}</p>
              <p className="tema-page__favourite-name">Eren Jaeger</p>
              <p className="obw-body obw-body--flush">{t('tema.whyIlariaBody')}</p>
            </div>
            <div className="tema-page__favourite">
              <p className="obw-kicker">{t('tema.whyDavideLabel')}</p>
              <p className="tema-page__favourite-name">Levi Ackerman</p>
              <p className="obw-body obw-body--flush">{t('tema.whyDavideBody')}</p>
            </div>
          </div>
        </TemaSection>

        <TemaSection title={t('tema.crestTitle')}>
          <MissionDocumentSeal />
          <p className="obw-body obw-body--flush">{t('tema.crestBody')}</p>
          <p className="obw-body obw-body--flush">{t('tema.crestBody2')}</p>
        </TemaSection>

        <TemaSection title={t('tema.symbolsTitle')}>
          <p className="obw-body obw-body--flush">{t('tema.symbolsIntro')}</p>
          <dl className="tema-page__terms">
            {SYMBOL_IDS.map((id) => (
              <div key={id}>
                <dt>{t(`tema.symbol${id}Term`)}</dt>
                <dd>{t(`tema.symbol${id}Body`)}</dd>
              </div>
            ))}
          </dl>
        </TemaSection>


        <TemaSection title={t('tema.glossaryTitle')}>
          <p className="obw-body obw-body--flush">{t('tema.glossaryIntro')}</p>
          <dl className="tema-page__terms">
            {GLOSSARY_IDS.map((id) => (
              <div key={id}>
                <dt>{t(`tema.glossary${id}Term`)}</dt>
                <dd>{t(`tema.glossary${id}Body`)}</dd>
              </div>
            ))}
          </dl>
        </TemaSection>


        <TemaSection title={t('tema.watchTitle')}>
          <p className="obw-body obw-body--flush">{t('tema.watchIntro')}</p>

          <p className="obw-kicker">{t('tema.watchAnimeTitle')}</p>
          <dl className="tema-page__terms">
            {ANIME_LINKS.map((link) => (
              <div key={link.id}>
                <dt>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <Tv size={14} aria-hidden />
                    {link.label}
                  </a>
                </dt>
                <dd>{t(`tema.watch${link.id}Body`)}</dd>
              </div>
            ))}
          </dl>

          <p className="obw-kicker">{t('tema.watchMangaTitle')}</p>
          <dl className="tema-page__terms">
            {MANGA_LINKS.map((link) => (
              <div key={link.id}>
                <dt>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <BookOpen size={14} aria-hidden />
                    {link.label}
                  </a>
                </dt>
                <dd>{t(`tema.watch${link.id}Body`)}</dd>
              </div>
            ))}
            <div>
              <dt>
                <BookOpen size={14} aria-hidden />
                {t('tema.watchPrintTerm')}
              </dt>
              <dd>{t('tema.watchPrintBody')}</dd>
            </div>
          </dl>

          <p className="tema-page__note">{t('tema.watchNote')}</p>
        </TemaSection>
      </div>
    </div>
  );
}
