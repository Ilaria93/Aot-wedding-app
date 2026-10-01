import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  approveInviteRequest,
  fetchAdminInvites,
  fetchPendingInviteCount,
  fetchPendingInviteRequests,
  markInviteSent,
  rejectInviteRequest,
} from '@/services/adminInvitesApi';

const get = vi.fn();
const post = vi.fn();

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

describe('adminInvitesApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('lists only pending requests', async () => {
    get.mockResolvedValue({ data: [] });
    await fetchPendingInviteRequests();
    expect(get).toHaveBeenCalledWith('/admin/invite-requests', { params: { status: 'pending' } });
  });

  it('unwraps the pending count', async () => {
    get.mockResolvedValue({ data: { pending: 3 } });
    expect(await fetchPendingInviteCount()).toBe(3);
    expect(get).toHaveBeenCalledWith('/admin/invite-requests/pending-count');
  });

  it('approves, rejects and marks sent on the id-scoped endpoints', async () => {
    post.mockResolvedValue({ data: { invite_link_id: 9, invite_url: 'u', whatsapp_url: 'w' } });
    expect((await approveInviteRequest(4)).whatsapp_url).toBe('w');
    expect(post).toHaveBeenCalledWith('/admin/invite-requests/4/approve');

    post.mockResolvedValue({ data: {} });
    await rejectInviteRequest(5);
    expect(post).toHaveBeenCalledWith('/admin/invite-requests/5/reject');

    await markInviteSent(6);
    expect(post).toHaveBeenCalledWith('/admin/invites/6/mark-sent');
  });

  it('lists every invite without server-side filters', async () => {
    get.mockResolvedValue({ data: [] });
    await fetchAdminInvites();
    expect(get).toHaveBeenCalledWith('/admin/invites');
  });
});
