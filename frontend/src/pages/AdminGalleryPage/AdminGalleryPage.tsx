import { useI18n } from '@/contexts/I18nContext';

/** Admin section — photo gallery moderation (coming soon). */
export function AdminGalleryPage() {
  const { t } = useI18n();

  return (
    <section className="obw-card">
      <p className="obw-body obw-body--flush">{t('admin.placeholder.comingSoon')}</p>
    </section>
  );
}
