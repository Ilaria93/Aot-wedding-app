import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import './styles/NotFoundPage.scss';

/** 404 page for unknown routes. */
export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="obw-page not-found-page">
      <div className="not-found-page__inner obw-portal-frame obw-portal-frame--light">
        <h1 className="obw-display">{t('notFound.title')}</h1>
        <p className="obw-body">{t('notFound.body')}</p>
        <Link className="obw-btn obw-btn--primary obw-btn--block" to="/">
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
}
