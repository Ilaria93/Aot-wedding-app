import { CalendarPlus } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import { openWeddingCalendar } from '@/services/weddingCalendar';
import './styles/AddToCalendarButton.scss';

type AddToCalendarButtonProps = {
  className?: string;
  tabIndex?: number;
};

/** "Add to calendar": one tap, straight into the phone's calendar with the event already filled in. */
export function AddToCalendarButton({ className = '', tabIndex }: AddToCalendarButtonProps) {
  const { t, locale } = useI18n();

  return (
    <button
      type="button"
      className={`obw-btn obw-btn--secondary add-to-calendar ${className}`.trim()}
      tabIndex={tabIndex}
      onClick={() => openWeddingCalendar(t, locale)}>
      <CalendarPlus size={16} aria-hidden />
      {t('calendar.add')}
    </button>
  );
}
