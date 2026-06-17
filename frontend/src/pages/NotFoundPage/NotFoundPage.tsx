import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import './styles/NotFoundPage.scss';

/** 404 page for unknown routes. */
export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="page-centered">
      <div className="card">
        <h1 className="title">{t('notFound.title')}</h1>
        <p className="subtitle">{t('notFound.body')}</p>
        <Link className="button button-primary" to="/">
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
}
