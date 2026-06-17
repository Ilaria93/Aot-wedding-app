import { describe, expect, it } from 'vitest';

import type { LogisticsContactItem } from '@/services/logisticsContactsApi';
import { buildContactActions } from '@/pages/TravelPage/travelContactActions';

const translate = ((key: string) => key) as never;

const baseContact: LogisticsContactItem = {
  id: 1,
  category: 'hotel',
  label: 'Hotel Ravenna',
  contact_person: null,
  phone: null,
  whatsapp_phone: null,
  email: null,
  website: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  address: null,
  notes: null,
  sort_order: 0,
  is_active: true,
};

describe('buildContactActions', () => {
  it('builds phone and whatsapp actions', () => {
    const actions = buildContactActions(
      {
        ...baseContact,
        phone: '+39 0544 123456',
        whatsapp_phone: '+39 333 1112233',
      },
      translate,
    );

    expect(actions.map((action) => action.id)).toEqual(['phone', 'whatsapp']);
    expect(actions[0]?.url).toBe('tel:+39 0544 123456');
    expect(actions[1]?.url).toBe('https://wa.me/393331112233');
  });

  it('normalizes website and social URLs', () => {
    const actions = buildContactActions(
      {
        ...baseContact,
        website: 'example.com',
        instagram_url: 'instagram.com/hotel',
        email: 'info@example.com',
      },
      translate,
    );

    expect(actions.find((action) => action.id === 'website')?.url).toBe('https://example.com');
    expect(actions.find((action) => action.id === 'instagram')?.url).toBe(
      'https://instagram.com/hotel',
    );
    expect(actions.find((action) => action.id === 'email')?.url).toBe('mailto:info@example.com');
  });
});
