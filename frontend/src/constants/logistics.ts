import type { LogisticsContactCategory } from '@/services/logisticsContactsApi';
import type { TranslateFn } from '@/i18n/translations';

export const LOGISTICS_CONTACT_CATEGORY_IDS: LogisticsContactCategory[] = [
  'location',
  'beauty',
  'transfer',
  'catering',
  'laundry',
];

export function getLogisticsContactCategoryLabel(
  category: LogisticsContactCategory,
  t: TranslateFn,
) {
  if (category === 'location') {
    return t('logisticsCategories.location');
  }
  if (category === 'beauty') {
    return t('logisticsCategories.beauty');
  }
  if (category === 'transfer') {
    return t('logisticsCategories.transfer');
  }
  if (category === 'catering') {
    return t('logisticsCategories.catering');
  }
  if (category === 'laundry') {
    return t('logisticsCategories.laundry');
  }

  return category;
}
