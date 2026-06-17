import type { LogisticsContactCategory } from '@/services/logisticsContactsApi';
import type { TranslateFn } from '@/i18n/translations';

export const LOGISTICS_CONTACT_CATEGORY_IDS: LogisticsContactCategory[] = [
  'hair',
  'makeup',
  'laundry',
  'hotel',
  'transfer',
  'car_rental',
];

export function getLogisticsContactCategoryLabel(
  category: LogisticsContactCategory,
  t: TranslateFn,
) {
  if (category === 'hair') {
    return t('logisticsCategories.hair');
  }
  if (category === 'makeup') {
    return t('logisticsCategories.makeup');
  }
  if (category === 'laundry') {
    return t('logisticsCategories.laundry');
  }
  if (category === 'hotel') {
    return t('logisticsCategories.hotel');
  }
  if (category === 'transfer') {
    return t('logisticsCategories.transfer');
  }
  if (category === 'car_rental') {
    return t('logisticsCategories.car_rental');
  }

  return category;
}
