import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createInvite,
  fetchAdminInvites,
  fetchPersonWhatsappUrl,
  getDuplicateMatches,
  importInvitesCsv,
  isLockedError,
  lookupInvites,
  markInviteSent,
  updateInvite,
  type CreateInvitePayload,
} from '@/services/adminInvitesApi';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

const payload: CreateInvitePayload = {
  first_name: 'Christian',
  last_name: 'Rossi',
  gender: 'm',
  phone: null,
  head_id: null,
  relation: null,
  family_name: null,
  party_size: null,
};

describe('adminInvitesApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('lists every group', async () => {
    get.mockResolvedValue({ data: [] });
    await fetchAdminInvites();
    expect(get).toHaveBeenCalledWith('/admin/invites');
  });

  it('creates a person and only asks to confirm a duplicate when told to', async () => {
    post.mockResolvedValue({ data: { id: 1 } });
    await createInvite(payload);
    expect(post).toHaveBeenLastCalledWith('/admin/invites', payload, { params: undefined });
    await createInvite(payload, true);
    expect(post).toHaveBeenLastCalledWith('/admin/invites', payload, { params: { confirm_duplicate: true } });
  });

  it('updates a person with PATCH', async () => {
    patch.mockResolvedValue({ data: { id: 7 } });
    await updateInvite(7, { first_name: 'Cristian' });
    expect(patch).toHaveBeenCalledWith('/admin/invites/7', { first_name: 'Cristian' });
  });

  it('looks people up without sending an empty phone', async () => {
    get.mockResolvedValue({ data: [] });
    await lookupInvites({ first_name: 'A', last_name: 'B', phone: '' });
    expect(get).toHaveBeenCalledWith('/admin/invites/lookup', {
      params: { first_name: 'A', last_name: 'B', phone: undefined },
    });
  });

  it('marks an invite sent', async () => {
    post.mockResolvedValue({ data: { id: 3 } });
    await markInviteSent(3);
    expect(post).toHaveBeenCalledWith('/admin/invites/3/mark-sent');
  });

  it('fetches the WhatsApp link addressed to a member', async () => {
    get.mockResolvedValue({ data: { whatsapp_url: 'https://wa.me/39333?text=x' } });
    await expect(fetchPersonWhatsappUrl(1, 2)).resolves.toBe('https://wa.me/39333?text=x');
    expect(get).toHaveBeenCalledWith('/admin/invites/1/whatsapp/2');
  });

  it('uploads the CSV as multipart form data', async () => {
    post.mockResolvedValue({ data: { created: 1, skipped_duplicates: [], errors: [] } });
    const file = new File(['first_name,last_name\nA,B\n'], 'invitati.csv', { type: 'text/csv' });
    await importInvitesCsv(file);
    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/admin/invites/import');
    expect((body as FormData).get('file')).toBe(file);
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
  });
});

describe('error helpers', () => {
  const error = (detail: unknown) => ({ response: { data: { detail } } });

  it('reads the duplicate matches of a 409', () => {
    const matches = [{ id: 1 }];
    expect(getDuplicateMatches(error({ code: 'duplicate', matches }))).toEqual(matches);
    expect(getDuplicateMatches(error({ code: 'locked' }))).toEqual([]);
    expect(getDuplicateMatches(error('Invalid'))).toEqual([]);
    expect(getDuplicateMatches(new Error('network'))).toEqual([]);
  });

  it('recognises the locked answer', () => {
    expect(isLockedError(error({ code: 'locked', message: 'Invite already sent' }))).toBe(true);
    expect(isLockedError(error({ code: 'duplicate' }))).toBe(false);
    expect(isLockedError(error('x'))).toBe(false);
  });
});
