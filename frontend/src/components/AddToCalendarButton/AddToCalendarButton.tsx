import { CalendarPlus } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import { downloadWeddingCalendar } from '@/services/weddingCalendar';
import './styles/AddToCalendarButton.scss';

type AddToCalendarButtonProps = {
  className?: string;
  tabIndex?: number;
};

/** "Add to calendar": saves the wedding as an event (start, end, place, where to stay). */
export function AddToCalendarButton({ className = '', tabIndex }: AddToCalendarButtonProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={`obw-btn obw-btn--secondary add-to-calendar ${className}`.trim()}
      tabIndex={tabIndex}
      onClick={() => downloadWeddingCalendar(t)}>
      <CalendarPlus size={16} aria-hidden />
      {t('calendar.add')}
    </button>
  );
}
