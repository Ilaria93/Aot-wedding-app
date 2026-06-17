import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import './styles/ScreenBackButton.scss';

type ScreenBackButtonProps = {
  fallback?: string;
};

/** Header back control for nested routes. */
export function ScreenBackButton({ fallback = '/' }: ScreenBackButtonProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  }

  return (
    <button type="button" className="screen-back" onClick={handleBack}>
      <ChevronLeft size={18} aria-hidden />
      <span>{t('common.back')}</span>
    </button>
  );
}
