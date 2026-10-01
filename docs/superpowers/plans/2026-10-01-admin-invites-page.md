# Admin "Inviti" Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the couple an admin page at `/admin/invites` to approve or reject invite requests from the site, and to send every invite on WhatsApp with one tap.

**Architecture:** The backend APIs already exist (PR #31). This plan adds two backend guards and then the admin UI. The UI has four parts:
- a typed API service;
- pure helpers (filtering, counts), unit-tested with vitest;
- a nav entry with a pending-count badge (desktop top bar and mobile tab bar);
- one page with two sections: pending requests and all invites.

The page reuses the admin building blocks already in the repo: `obw-portal-card` and `obw-portal-panel`, `FilterPills`, `SearchBar`, `AdminModal`, `obw-portal-btn` and `PageAlert`.

**Tech Stack:**
- Backend: FastAPI, SQLAlchemy 2, pytest on Postgres.
- Frontend: React 18, TypeScript, Vite, react-router-dom (`BrowserRouter`), axios `apiClient`, vitest in the node environment (no DOM, no Testing Library), SCSS.

**Spec:** `docs/superpowers/specs/2026-10-01-invite-requests-design.md`. This plan covers §"Admin: pagina Inviti" and phase 3 of §Fasi.

## Global Constraints

- Admin routes are only for the couple's roles. The frontend already gates `/admin/*` in `AdminLayout`, and the backend uses `require_admin_user`.
- WhatsApp message and link are built **only in the backend** (`whatsapp_url` in the API responses). The frontend never composes a `wa.me` URL for invites.
- Approve flow: **"Approva e invia su WhatsApp"** calls `approve`, opens `whatsapp_url` in a new tab, then calls `mark-sent`.
- Reject flow: **"Rifiuta"** asks for confirmation in `AdminModal` (`role="alertdialog"`).
- "Tutti gli inviti" list:
  - `FilterPills` with *Da inviare / Inviati / Hanno risposto* (`to_send` / `sent` / `answered`);
  - `SearchBar` by name or phone;
  - per invite: name, phone, status, and **"Invia su WhatsApp"**, or **"Rimanda"** when `sent_at` is set.
- Filter semantics, identical to the backend's `list_admin_invites`:
  - `to_send` means `sent_at === null`;
  - `sent` means `sent_at !== null`;
  - `answered` means `answer !== 'none'`.
- Every new UI string goes into **all 4 locales** (`it`, `en`, `fr`, `de`) under the same keys. The locales must keep identical shapes, or `tsc` fails (`DeepTranslateShape`).
- Admin buttons use the portal classes (`obw-portal-btn`, `obw-portal-btn--secondary`), not the landing's lilac `.obw-btn`.
- Commit messages end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Backend tests: from `backend/`, run `venv/bin/pytest -q` (Postgres via the existing conftest). Frontend checks: from `frontend/`, run `npx tsc -b` and `npx vitest run`.

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/services/invite_request_service.py` (modify) | `InviteRequestAlreadyDecidedError`; approve/reject only from `pending`; `mark_invite_sent` keeps the first `sent_at` |
| `backend/routes/admin_invite_route.py` (modify) | Maps the new error to 409 |
| `backend/tests/test_admin_invites_api.py` (modify) | Tests for the 409 guard and the first-`sent_at` rule |
| `frontend/src/services/adminInvitesApi.ts` (create) | Types and calls for the admin invite endpoints |
| `frontend/src/pages/AdminInvitesPage/inviteFilters.ts` (create) | Pure helpers: `filterInvites`, `countInvites`, `INVITE_REQUESTS_CHANGED` event name |
| `frontend/src/__tests__/adminInvitesApi.test.ts` (create) | API service calls the right endpoints |
| `frontend/src/__tests__/inviteFilters.test.ts` (create) | Filter, search and count semantics |
| `frontend/src/hooks/usePendingInviteCount.ts` (create) | Badge count: fetched on route change and on the `INVITE_REQUESTS_CHANGED` window event |
| `frontend/src/components/AppTopBar/AppTopBar.tsx` (modify) | "Inviti" admin route with badge |
| `frontend/src/components/AdminMobileNav/AdminMobileNav.tsx` (+ scss) (modify) | "Inviti" tab with badge |
| `frontend/src/layouts/AdminLayout/useAdminHeroContent.ts` (modify) | Hero copy for `/admin/invites` |
| `frontend/src/pages/AdminInvitesPage/AdminInvitesPage.tsx`, `index.ts`, `styles/AdminInvitesPage.scss` (create) | The page |
| `frontend/src/App.tsx` (modify) | Route `invites` under `/admin` |
| `frontend/src/i18n/locales/{it,en,fr,de}.ts` (modify) | `admin.nav.invites`, hero keys, `admin.invites.*` |

---

### Task 1: Backend guards (409 on re-decide, first `sent_at` kept)

**Files:**
- Modify: `backend/services/invite_request_service.py` (functions `approve_invite_request`, `reject_invite_request` and `mark_invite_sent`, plus a new error class next to `InviteRequestNotFoundError`)
- Modify: `backend/routes/admin_invite_route.py`
- Test: `backend/tests/test_admin_invites_api.py`

**Interfaces:**
- Produces:
  - `POST /admin/invite-requests/{id}/approve` and `/reject` answer **409** with `detail: "Invite request already decided"` when the request's status is not `pending`.
  - `POST /admin/invites/{id}/mark-sent` leaves `sent_at` unchanged when it is already set. A resend does not move the first-sent date.

- [ ] **Step 1: Write the failing tests.** Append to `backend/tests/test_admin_invites_api.py`. `_add_request` and `_add_invite` already exist at the top of the file.

```python
def test_approve_twice_is_409(api_client, admin_headers):
    request_id = _add_request()
    assert api_client.post(f"/admin/invite-requests/{request_id}/approve").status_code == 200
    second = api_client.post(f"/admin/invite-requests/{request_id}/approve")
    assert second.status_code == 409
    assert second.json()["detail"] == "Invite request already decided"


def test_reject_after_approve_is_409(api_client, admin_headers):
    request_id = _add_request()
    api_client.post(f"/admin/invite-requests/{request_id}/approve")
    assert api_client.post(f"/admin/invite-requests/{request_id}/reject").status_code == 409


def test_approve_rejected_request_is_409(api_client, admin_headers):
    request_id = _add_request(status="rejected")
    assert api_client.post(f"/admin/invite-requests/{request_id}/approve").status_code == 409


def test_mark_sent_twice_keeps_first_timestamp(api_client, admin_headers):
    invite_id = _add_invite()
    first = api_client.post(f"/admin/invites/{invite_id}/mark-sent").json()["sent_at"]
    second = api_client.post(f"/admin/invites/{invite_id}/mark-sent").json()["sent_at"]
    assert first is not None
    assert second == first
```

- [ ] **Step 2: Run them and confirm they fail.**

Run: `cd backend && venv/bin/pytest tests/test_admin_invites_api.py -q`
Expected: the 4 new tests FAIL (200 instead of 409, and a different `sent_at`). The existing tests pass.

- [ ] **Step 3: Implement.** In `backend/services/invite_request_service.py`, add the error class right after `InviteRequestNotFoundError`:

```python
class InviteRequestAlreadyDecidedError(Exception):
    pass


def _require_pending(request: InviteRequest) -> None:
    # A double tap or a stale admin tab must not re-decide a request.
    if request.status != "pending":
        raise InviteRequestAlreadyDecidedError("Invite request already decided")
```

In `approve_invite_request` and `reject_invite_request`, call `_require_pending(request)` immediately after `request = _get_request(db, request_id)`.

In `mark_invite_sent`, replace `invite.sent_at = datetime.utcnow()` with:

```python
    # Resending keeps the first-sent date: "Inviato il" means the first send.
    if invite.sent_at is None:
        invite.sent_at = datetime.utcnow()
```

In `backend/routes/admin_invite_route.py`:
1. Add `InviteRequestAlreadyDecidedError` to the import list from `services.invite_request_service`.
2. In both `approve_request` and `reject_request`, add after the existing `except InviteRequestNotFoundError` block:

```python
    except InviteRequestAlreadyDecidedError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
```

- [ ] **Step 4: Run the full backend suite.**

Run: `cd backend && venv/bin/pytest -q`
Expected: all pass. That is 146 tests: the 142 from before plus the 4 new ones. There are 16 pre-existing warnings and no new ones.

- [ ] **Step 5: Commit.**

```bash
git add backend/services/invite_request_service.py backend/routes/admin_invite_route.py backend/tests/test_admin_invites_api.py
git commit -m "fix(invites): 409 when re-deciding a request; resend keeps first sent_at

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Frontend API service and pure filter helpers

**Files:**
- Create: `frontend/src/services/adminInvitesApi.ts`
- Create: `frontend/src/pages/AdminInvitesPage/inviteFilters.ts`
- Test: `frontend/src/__tests__/adminInvitesApi.test.ts`, `frontend/src/__tests__/inviteFilters.test.ts`

**Interfaces:**
- Produces, from `@/services/adminInvitesApi`:
  - `type InviteRequestStatus = 'pending' | 'approved' | 'rejected'`
  - `type InviteRequestItem = { id: number; first_name: string; last_name: string; phone: string; status: InviteRequestStatus; created_at: string; decided_at: string | null; invite_link_id: number | null; existing_invite: { id: number; first_name: string; last_name: string } | null }`
  - `type InviteAnswer = 'none' | 'attending' | 'declined'`
  - `type AdminInviteItem = { id: number; first_name: string; last_name: string; phone: string | null; sent_at: string | null; answer: InviteAnswer; invite_url: string; whatsapp_url: string }`
  - `type ApproveInviteResult = { invite_link_id: number; invite_url: string; whatsapp_url: string }`
  - `fetchPendingInviteRequests(): Promise<InviteRequestItem[]>`, which calls `GET /admin/invite-requests` with `{ params: { status: 'pending' } }`
  - `fetchPendingInviteCount(): Promise<number>`, which calls `GET /admin/invite-requests/pending-count` and returns `data.pending`
  - `approveInviteRequest(id: number): Promise<ApproveInviteResult>`, which calls `POST /admin/invite-requests/{id}/approve`
  - `rejectInviteRequest(id: number): Promise<void>`, which calls `POST /admin/invite-requests/{id}/reject`
  - `fetchAdminInvites(): Promise<AdminInviteItem[]>`, which calls `GET /admin/invites` (no params; filtering happens client-side)
  - `markInviteSent(id: number): Promise<AdminInviteItem>`, which calls `POST /admin/invites/{id}/mark-sent`
- Produces, from `@/pages/AdminInvitesPage/inviteFilters`:
  - `type InviteFilter = 'to_send' | 'sent' | 'answered'`
  - `filterInvites(invites: AdminInviteItem[], filter: InviteFilter, search: string): AdminInviteItem[]`
  - `countInvites(invites: AdminInviteItem[]): Record<InviteFilter, number>`
  - `const INVITE_REQUESTS_CHANGED = 'invite-requests-changed'`: the window event name the page dispatches after approve or reject so the nav badge refetches.

- [ ] **Step 1: Write the failing tests.**

`frontend/src/__tests__/adminInvitesApi.test.ts`:

```ts
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
```

`frontend/src/__tests__/inviteFilters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { countInvites, filterInvites } from '@/pages/AdminInvitesPage/inviteFilters';
import type { AdminInviteItem } from '@/services/adminInvitesApi';

function invite(overrides: Partial<AdminInviteItem>): AdminInviteItem {
  return {
    id: 1,
    first_name: 'Mario',
    last_name: 'Rossi',
    phone: '+393331234567',
    sent_at: null,
    answer: 'none',
    invite_url: 'https://site/invito/t',
    whatsapp_url: 'https://wa.me/393331234567?text=x',
    ...overrides,
  };
}

const notSent = invite({ id: 1 });
const sentNoAnswer = invite({ id: 2, first_name: 'Luca', sent_at: '2026-10-01T10:00:00' });
const sentAttending = invite({ id: 3, first_name: 'Anna', last_name: 'Bianchi', sent_at: '2026-10-01T10:00:00', answer: 'attending' });
const noPhone = invite({ id: 4, first_name: 'Zia', phone: null });
const all = [notSent, sentNoAnswer, sentAttending, noPhone];

describe('filterInvites', () => {
  it('to_send keeps invites never sent', () => {
    expect(filterInvites(all, 'to_send', '').map((i) => i.id)).toEqual([1, 4]);
  });

  it('sent keeps invites with sent_at', () => {
    expect(filterInvites(all, 'sent', '').map((i) => i.id)).toEqual([2, 3]);
  });

  it('answered keeps invites with any answer', () => {
    expect(filterInvites(all, 'answered', '').map((i) => i.id)).toEqual([3]);
  });

  it('searches first name, last name and phone, case-insensitively and trimmed', () => {
    expect(filterInvites(all, 'sent', '  bianchi ').map((i) => i.id)).toEqual([3]);
    expect(filterInvites(all, 'to_send', '3331234').map((i) => i.id)).toEqual([1]);
    expect(filterInvites(all, 'to_send', 'ZIA').map((i) => i.id)).toEqual([4]);
  });
});

describe('countInvites', () => {
  it('counts each filter on the unsearched list', () => {
    expect(countInvites(all)).toEqual({ to_send: 2, sent: 2, answered: 1 });
  });
});
```

- [ ] **Step 2: Run them and confirm they fail.**

Run: `cd frontend && npx vitest run src/__tests__/adminInvitesApi.test.ts src/__tests__/inviteFilters.test.ts`
Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 3: Implement.**

`frontend/src/services/adminInvitesApi.ts`:

```ts
import { apiClient } from '@/services/apiClient';

export type InviteRequestStatus = 'pending' | 'approved' | 'rejected';

export type InviteRequestItem = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  status: InviteRequestStatus;
  created_at: string;
  decided_at: string | null;
  invite_link_id: number | null;
  /** Set when this phone already has an invite: approving re-sends that one. */
  existing_invite: { id: number; first_name: string; last_name: string } | null;
};

export type InviteAnswer = 'none' | 'attending' | 'declined';

export type AdminInviteItem = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  sent_at: string | null;
  answer: InviteAnswer;
  invite_url: string;
  /** Built by the backend with the personal message already written. */
  whatsapp_url: string;
};

export type ApproveInviteResult = {
  invite_link_id: number;
  invite_url: string;
  whatsapp_url: string;
};

// Requests from the home "Non trovi il tuo invito?" dialog still awaiting a decision.
export async function fetchPendingInviteRequests(): Promise<InviteRequestItem[]> {
  const { data } = await apiClient.get<InviteRequestItem[]>('/admin/invite-requests', {
    params: { status: 'pending' },
  });
  return data;
}

// Number shown on the "Inviti" nav badge.
export async function fetchPendingInviteCount(): Promise<number> {
  const { data } = await apiClient.get<{ pending: number }>('/admin/invite-requests/pending-count');
  return data.pending;
}

export async function approveInviteRequest(requestId: number): Promise<ApproveInviteResult> {
  const { data } = await apiClient.post<ApproveInviteResult>(`/admin/invite-requests/${requestId}/approve`);
  return data;
}

export async function rejectInviteRequest(requestId: number): Promise<void> {
  await apiClient.post(`/admin/invite-requests/${requestId}/reject`);
}

// Every invite; the page filters and searches client-side (a wedding's worth of rows).
export async function fetchAdminInvites(): Promise<AdminInviteItem[]> {
  const { data } = await apiClient.get<AdminInviteItem[]>('/admin/invites');
  return data;
}

// Called right after the admin opens the WhatsApp link.
export async function markInviteSent(inviteId: number): Promise<AdminInviteItem> {
  const { data } = await apiClient.post<AdminInviteItem>(`/admin/invites/${inviteId}/mark-sent`);
  return data;
}
```

`frontend/src/pages/AdminInvitesPage/inviteFilters.ts`:

```ts
import type { AdminInviteItem } from '@/services/adminInvitesApi';

export type InviteFilter = 'to_send' | 'sent' | 'answered';

/** Window event the page fires after approve/reject so the nav badge refetches. */
export const INVITE_REQUESTS_CHANGED = 'invite-requests-changed';

// Same rules as the backend's list_admin_invites filter.
const MATCHES: Record<InviteFilter, (invite: AdminInviteItem) => boolean> = {
  to_send: (invite) => invite.sent_at === null,
  sent: (invite) => invite.sent_at !== null,
  answered: (invite) => invite.answer !== 'none',
};

export function filterInvites(invites: AdminInviteItem[], filter: InviteFilter, search: string): AdminInviteItem[] {
  const query = search.trim().toLowerCase();
  return invites.filter(
    (invite) =>
      MATCHES[filter](invite) &&
      (!query ||
        invite.first_name.toLowerCase().includes(query) ||
        invite.last_name.toLowerCase().includes(query) ||
        (invite.phone ?? '').includes(query)),
  );
}

export function countInvites(invites: AdminInviteItem[]): Record<InviteFilter, number> {
  return {
    to_send: invites.filter(MATCHES.to_send).length,
    sent: invites.filter(MATCHES.sent).length,
    answered: invites.filter(MATCHES.answered).length,
  };
}
```

- [ ] **Step 4: Run them and confirm they pass.**

Run: `cd frontend && npx vitest run && npx tsc -b`
Expected: all vitest files pass and `tsc` exits 0.

- [ ] **Step 5: Commit.**

```bash
git add frontend/src/services/adminInvitesApi.ts frontend/src/pages/AdminInvitesPage/inviteFilters.ts frontend/src/__tests__/adminInvitesApi.test.ts frontend/src/__tests__/inviteFilters.test.ts
git commit -m "feat(admin): invites API service and client-side invite filters

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: "Inviti" nav entry with pending badge, hero copy and i18n

**Files:**
- Create: `frontend/src/hooks/usePendingInviteCount.ts`
- Modify: `frontend/src/components/AppTopBar/AppTopBar.tsx` (the `ADMIN_ROUTES` const, `NavItem`, `getNavItems`, `NavItemLink`)
- Modify: `frontend/src/components/AppTopBar/styles/AppTopBar.scss`
- Modify: `frontend/src/components/AdminMobileNav/AdminMobileNav.tsx` and `styles/AdminMobileNav.scss`
- Modify: `frontend/src/layouts/AdminLayout/useAdminHeroContent.ts`
- Modify: `frontend/src/i18n/locales/it.ts`, `en.ts`, `fr.ts`, `de.ts`

**Interfaces:**
- Consumes: `fetchPendingInviteCount` (Task 2) and `INVITE_REQUESTS_CHANGED` (Task 2).
- Produces:
  - `usePendingInviteCount(enabled: boolean): number`. It returns 0 while disabled or before the first load, and refetches when `location.pathname` changes or when the `INVITE_REQUESTS_CHANGED` window event fires. Errors keep the last value; a badge must never break the nav.
  - i18n keys that Task 4 and Task 5 rely on, all listed in Step 1 below.

- [ ] **Step 1: Add the i18n keys to all 4 locales.**

In each locale, add the following.
- `invites` to `admin.nav`, after `gallery`.
- Four keys to `admin.hero`, right after the `contactsSubtitle` entry.
- A new `admin.invites` block, placed right after the closing of `admin.nav`.

Values per locale:

`it.ts`:
```ts
// admin.nav
      invites: 'Inviti',
// admin.hero
      invitesCode: 'Inviti WhatsApp',
      invitesTitleLead: 'Inviti',
      invitesTitleHighlight: '& Richieste',
      invitesSubtitle:
        'Approva le richieste arrivate dal sito e manda a ogni ospite il suo link personale su WhatsApp.',
// admin.invites
    invites: {
      requestsTitle: 'Richieste in attesa',
      requestsEmpty: 'Nessuna richiesta in attesa.',
      requestedOn: 'Richiesta il {{date}}',
      existingInvite: 'Ha già un invito: {{name}}',
      approve: 'Approva e invia su WhatsApp',
      approving: 'Approvo…',
      reject: 'Rifiuta',
      rejectConfirmTitle: 'Rifiutare la richiesta?',
      rejectConfirmBody: 'La richiesta di {{name}} verrà segnata come rifiutata e non riceverà nessun invito.',
      listTitle: 'Tutti gli inviti',
      filterToSend: 'Da inviare ({{count}})',
      filterSent: 'Inviati ({{count}})',
      filterAnswered: 'Hanno risposto ({{count}})',
      searchPlaceholder: 'Cerca per nome o telefono',
      listEmpty: 'Nessun invito in questa lista.',
      send: 'Invia su WhatsApp',
      resend: 'Rimanda',
      noPhone: 'Nessun telefono',
      sentOn: 'Inviato il {{date}}',
      notSent: 'Non ancora inviato',
      answerNone: 'Nessuna risposta',
      answerAttending: 'Presente',
      answerDeclined: 'Assente',
      loadFailed: 'Non è stato possibile caricare gli inviti.',
      actionFailed: 'Operazione non riuscita. Riprova.',
      alreadyDecided: 'Questa richiesta era già stata gestita: l’elenco è stato aggiornato.',
    },
```

`en.ts`:
```ts
      invites: 'Invites',
      invitesCode: 'WhatsApp invites',
      invitesTitleLead: 'Invites',
      invitesTitleHighlight: '& Requests',
      invitesSubtitle: 'Approve requests from the site and send every guest their personal link on WhatsApp.',
    invites: {
      requestsTitle: 'Pending requests',
      requestsEmpty: 'No pending requests.',
      requestedOn: 'Requested on {{date}}',
      existingInvite: 'Already has an invite: {{name}}',
      approve: 'Approve and send on WhatsApp',
      approving: 'Approving…',
      reject: 'Reject',
      rejectConfirmTitle: 'Reject this request?',
      rejectConfirmBody: '{{name}}’s request will be marked as rejected and they will not get an invite.',
      listTitle: 'All invites',
      filterToSend: 'To send ({{count}})',
      filterSent: 'Sent ({{count}})',
      filterAnswered: 'Answered ({{count}})',
      searchPlaceholder: 'Search by name or phone',
      listEmpty: 'No invites in this list.',
      send: 'Send on WhatsApp',
      resend: 'Resend',
      noPhone: 'No phone',
      sentOn: 'Sent on {{date}}',
      notSent: 'Not sent yet',
      answerNone: 'No answer',
      answerAttending: 'Attending',
      answerDeclined: 'Not attending',
      loadFailed: 'Could not load the invites.',
      actionFailed: 'Something went wrong. Please try again.',
      alreadyDecided: 'This request had already been handled: the list has been refreshed.',
    },
```

`fr.ts`:
```ts
      invites: 'Invitations',
      invitesCode: 'Invitations WhatsApp',
      invitesTitleLead: 'Invitations',
      invitesTitleHighlight: '& Demandes',
      invitesSubtitle: 'Approuve les demandes reçues sur le site et envoie à chaque invité son lien personnel sur WhatsApp.',
    invites: {
      requestsTitle: 'Demandes en attente',
      requestsEmpty: 'Aucune demande en attente.',
      requestedOn: 'Demandée le {{date}}',
      existingInvite: 'A déjà une invitation : {{name}}',
      approve: 'Approuver et envoyer sur WhatsApp',
      approving: 'Approbation…',
      reject: 'Refuser',
      rejectConfirmTitle: 'Refuser la demande ?',
      rejectConfirmBody: 'La demande de {{name}} sera marquée comme refusée et ne recevra pas d’invitation.',
      listTitle: 'Toutes les invitations',
      filterToSend: 'À envoyer ({{count}})',
      filterSent: 'Envoyées ({{count}})',
      filterAnswered: 'Ont répondu ({{count}})',
      searchPlaceholder: 'Rechercher par nom ou téléphone',
      listEmpty: 'Aucune invitation dans cette liste.',
      send: 'Envoyer sur WhatsApp',
      resend: 'Renvoyer',
      noPhone: 'Pas de téléphone',
      sentOn: 'Envoyée le {{date}}',
      notSent: 'Pas encore envoyée',
      answerNone: 'Pas de réponse',
      answerAttending: 'Présent',
      answerDeclined: 'Absent',
      loadFailed: 'Impossible de charger les invitations.',
      actionFailed: 'L’opération a échoué. Réessaie.',
      alreadyDecided: 'Cette demande avait déjà été traitée : la liste a été mise à jour.',
    },
```

`de.ts`:
```ts
      invites: 'Einladungen',
      invitesCode: 'WhatsApp-Einladungen',
      invitesTitleLead: 'Einladungen',
      invitesTitleHighlight: '& Anfragen',
      invitesSubtitle: 'Bestätige Anfragen von der Website und schicke jedem Gast seinen persönlichen Link per WhatsApp.',
    invites: {
      requestsTitle: 'Offene Anfragen',
      requestsEmpty: 'Keine offenen Anfragen.',
      requestedOn: 'Angefragt am {{date}}',
      existingInvite: 'Hat bereits eine Einladung: {{name}}',
      approve: 'Bestätigen und per WhatsApp senden',
      approving: 'Wird bestätigt…',
      reject: 'Ablehnen',
      rejectConfirmTitle: 'Anfrage ablehnen?',
      rejectConfirmBody: 'Die Anfrage von {{name}} wird als abgelehnt markiert und erhält keine Einladung.',
      listTitle: 'Alle Einladungen',
      filterToSend: 'Zu senden ({{count}})',
      filterSent: 'Gesendet ({{count}})',
      filterAnswered: 'Haben geantwortet ({{count}})',
      searchPlaceholder: 'Nach Name oder Telefon suchen',
      listEmpty: 'Keine Einladungen in dieser Liste.',
      send: 'Per WhatsApp senden',
      resend: 'Erneut senden',
      noPhone: 'Kein Telefon',
      sentOn: 'Gesendet am {{date}}',
      notSent: 'Noch nicht gesendet',
      answerNone: 'Keine Antwort',
      answerAttending: 'Kommt',
      answerDeclined: 'Kommt nicht',
      loadFailed: 'Die Einladungen konnten nicht geladen werden.',
      actionFailed: 'Das hat nicht geklappt. Bitte erneut versuchen.',
      alreadyDecided: 'Diese Anfrage war bereits bearbeitet: Die Liste wurde aktualisiert.',
    },
```

Escape the single quotes inside values if a locale file uses single-quoted strings. The curly `’` above needs no escaping.

- [ ] **Step 2: Create `frontend/src/hooks/usePendingInviteCount.ts`.**

```ts
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { INVITE_REQUESTS_CHANGED } from '@/pages/AdminInvitesPage/inviteFilters';
import { fetchPendingInviteCount } from '@/services/adminInvitesApi';

/**
 * Pending invite requests for the "Inviti" nav badge. Refetched on every
 * admin navigation and whenever the invites page approves or rejects one.
 * A failed load keeps the last value: the badge must never break the nav.
 */
export function usePendingInviteCount(enabled: boolean): number {
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    const load = () =>
      fetchPendingInviteCount()
        .then((value) => {
          if (active) setCount(value);
        })
        .catch(() => undefined);

    void load();
    window.addEventListener(INVITE_REQUESTS_CHANGED, load);
    return () => {
      active = false;
      window.removeEventListener(INVITE_REQUESTS_CHANGED, load);
    };
  }, [enabled, pathname]);

  return enabled ? count : 0;
}
```

- [ ] **Step 3: Add the desktop nav entry.** In `AppTopBar.tsx`:
1. Import `Send` from `lucide-react`, and `usePendingInviteCount` from `@/hooks/usePendingInviteCount`.
2. Extend the `ADMIN_ROUTES` `i18nKey` union with `'admin.nav.invites'`.
3. Insert `{ to: '/admin/invites', i18nKey: 'admin.nav.invites', icon: Send }` after the `rsvp` entry.
4. Add `badge?: number` to `NavItem`.
5. Give `getNavItems` a fourth parameter `pendingInvites: number`. Set `badge: route.to === '/admin/invites' ? pendingInvites : undefined` when mapping `ADMIN_ROUTES`.
6. In `NavItemLink`'s `content`, after the label span, render the badge only when it's greater than 0:

```tsx
      {item.badge ? <span className="site-header__badge">{item.badge}</span> : null}
```

7. In `AppTopBar`, call `const pendingInvites = usePendingInviteCount(canManageWedding);` and pass it to `getNavItems`.

Append to `AppTopBar.scss`:

```scss
/* Pending invite requests on the admin "Inviti" link. */
.site-header__badge {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  margin-left: 6px;
  padding: 0 5px;
  border-radius: 999px;
  background: #db7fb0;
  color: var(--obw-void);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
```

- [ ] **Step 4: Add the mobile tab.** In `AdminMobileNav.tsx`:
1. Import `Send`, `useAuth` (already imported) and `usePendingInviteCount`.
2. Add `{ to: '/admin/invites', icon: Send, labelKey: 'admin.nav.invites' as const }` after the `rsvp` tab.
3. Read `canManageWedding` from `useAuth()` and call `const pendingInvites = usePendingInviteCount(canManageWedding);`.
4. Wrap the icon in a positioned span so the badge sits on it:

```tsx
          <span className="admin-mobile-nav__icon">
            <tab.icon size={18} aria-hidden />
            {tab.to === '/admin/invites' && pendingInvites > 0 ? (
              <span className="admin-mobile-nav__badge">{pendingInvites}</span>
            ) : null}
          </span>
```

Append to `AdminMobileNav.scss`:

```scss
.admin-mobile-nav__icon {
  position: relative;
  display: inline-flex;
}

.admin-mobile-nav__badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #db7fb0;
  color: var(--obw-void);
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}
```

- [ ] **Step 5: Add the hero copy.** In `useAdminHeroContent.ts`, add to `ROUTE_HERO` after the `/admin/rsvp` entry:

```ts
  '/admin/invites': {
    eyebrowSegments: ['landing.hero.operationTag', 'common.roles.admin'],
    code: 'admin.hero.invitesCode',
    titleLead: 'admin.hero.invitesTitleLead',
    titleHighlight: 'admin.hero.invitesTitleHighlight',
    subtitle: 'admin.hero.invitesSubtitle',
  },
```

- [ ] **Step 6: Verify.**

Run: `cd frontend && npx tsc -b && npx vitest run`
Expected: both pass. `/admin/invites` itself doesn't exist until Task 4; the link renders anyway.

- [ ] **Step 7: Commit.**

```bash
git add frontend/src
git commit -m "feat(admin): Inviti nav entry with pending-requests badge

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: AdminInvitesPage, pending requests section, and route

**Files:**
- Create: `frontend/src/pages/AdminInvitesPage/AdminInvitesPage.tsx`, `frontend/src/pages/AdminInvitesPage/index.ts`, `frontend/src/pages/AdminInvitesPage/styles/AdminInvitesPage.scss`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Consumes:
  - `fetchPendingInviteRequests`, `approveInviteRequest`, `rejectInviteRequest`, `markInviteSent` and the `InviteRequestItem` type (Task 2);
  - `INVITE_REQUESTS_CHANGED` (Task 2);
  - the `admin.invites.*` i18n keys (Task 3);
  - `AdminModal` (`@/components/AdminModal`), `LoadingScreen` (`@/components/LoadingScreen`), `PageAlert` (`@/components/PageShell`) and `getApiStatusCode` (`@/services/apiErrors`).
- Produces: `export function AdminInvitesPage()`, routed at `/admin/invites`. Task 5 adds the "Tutti gli inviti" section to this same component, using the `reload()` function defined here.

- [ ] **Step 1: Create the page.** `frontend/src/pages/AdminInvitesPage/index.ts`:

```ts
export { AdminInvitesPage } from './AdminInvitesPage';
```

`frontend/src/pages/AdminInvitesPage/AdminInvitesPage.tsx`:

```tsx
import { MessageCircle, Phone, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PageAlert } from '@/components/PageShell';
import { useI18n } from '@/contexts/I18nContext';
import { getApiStatusCode } from '@/services/apiErrors';
import {
  approveInviteRequest,
  fetchPendingInviteRequests,
  markInviteSent,
  rejectInviteRequest,
  type InviteRequestItem,
} from '@/services/adminInvitesApi';
import { INVITE_REQUESTS_CHANGED } from './inviteFilters';
import './styles/AdminInvitesPage.scss';

function fullName(person: { first_name: string; last_name: string }) {
  return `${person.first_name} ${person.last_name}`;
}

/** Admin section: approve invite requests from the site and send invites on WhatsApp. */
export function AdminInvitesPage() {
  const { t, locale } = useI18n();
  const [requests, setRequests] = useState<InviteRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<InviteRequestItem | null>(null);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale);

  const reload = useCallback(async () => {
    try {
      setRequests(await fetchPendingInviteRequests());
      setError(null);
    } catch {
      setError(t('admin.invites.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // After approve/reject: refresh the lists and tell the nav badge to refetch.
  async function afterDecision() {
    window.dispatchEvent(new Event(INVITE_REQUESTS_CHANGED));
    await reload();
  }

  function reportActionError(caughtError: unknown) {
    setError(
      getApiStatusCode(caughtError) === 409 ? t('admin.invites.alreadyDecided') : t('admin.invites.actionFailed'),
    );
  }

  async function handleApprove(request: InviteRequestItem) {
    // Open the tab inside the click: browsers block window.open after an await.
    const whatsappTab = window.open('', '_blank');
    setBusyId(request.id);
    try {
      const result = await approveInviteRequest(request.id);
      if (whatsappTab) whatsappTab.location.href = result.whatsapp_url;
      else window.location.href = result.whatsapp_url;
      await markInviteSent(result.invite_link_id);
    } catch (caughtError) {
      whatsappTab?.close();
      reportActionError(caughtError);
    } finally {
      setBusyId(null);
      await afterDecision();
    }
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const target = rejectTarget;
    setBusyId(target.id);
    try {
      await rejectInviteRequest(target.id);
      setRejectTarget(null);
    } catch (caughtError) {
      setRejectTarget(null);
      reportActionError(caughtError);
    } finally {
      setBusyId(null);
      await afterDecision();
    }
  }

  if (loading) {
    return <LoadingScreen label={t('common.loading')} />;
  }

  return (
    <>
      {error ? <PageAlert message={error} /> : null}

      <section className="obw-portal-panel admin-invites__section">
        <h2 className="obw-portal-kicker admin-invites__section-title">{t('admin.invites.requestsTitle')}</h2>
        {requests.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.invites.requestsEmpty')}</p>
        ) : (
          <div className="admin-invites__grid">
            {requests.map((request) => (
              <article key={request.id} className="obw-portal-card admin-invites__card">
                <p className="admin-invites__name">{fullName(request)}</p>
                <p className="admin-invites__meta">
                  <Phone size={14} aria-hidden />
                  {request.phone}
                </p>
                <p className="admin-invites__meta">
                  {t('admin.invites.requestedOn', { date: formatDate(request.created_at) })}
                </p>
                {request.existing_invite ? (
                  <p className="admin-invites__warning">
                    {t('admin.invites.existingInvite', { name: fullName(request.existing_invite) })}
                  </p>
                ) : null}
                <div className="admin-invites__actions">
                  <button
                    type="button"
                    className="obw-portal-btn"
                    disabled={busyId === request.id}
                    onClick={() => void handleApprove(request)}>
                    <MessageCircle size={14} aria-hidden />
                    {busyId === request.id ? t('admin.invites.approving') : t('admin.invites.approve')}
                  </button>
                  <button
                    type="button"
                    className="obw-portal-btn obw-portal-btn--secondary"
                    disabled={busyId === request.id}
                    onClick={() => setRejectTarget(request)}>
                    <X size={14} aria-hidden />
                    {t('admin.invites.reject')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {rejectTarget ? (
        <AdminModal
          titleId="admin-invites-reject-title"
          title={t('admin.invites.rejectConfirmTitle')}
          role="alertdialog"
          onClose={() => setRejectTarget(null)}
          t={t}>
          <p className="admin-modal__body">
            {t('admin.invites.rejectConfirmBody', { name: fullName(rejectTarget) })}
          </p>
          <div className="admin-modal__actions">
            <button
              type="button"
              className="obw-portal-btn"
              disabled={busyId === rejectTarget.id}
              onClick={() => void confirmReject()}>
              {t('admin.invites.reject')}
            </button>
            <button
              type="button"
              className="obw-portal-btn obw-portal-btn--secondary"
              onClick={() => setRejectTarget(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </AdminModal>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Create the styles.** `frontend/src/pages/AdminInvitesPage/styles/AdminInvitesPage.scss`:

```scss
.admin-invites__section {
  display: grid;
  gap: var(--obw-space-md);
  margin-bottom: var(--obw-space-lg);
}

.admin-invites__section-title {
  margin: 0;
}

.admin-invites__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--obw-space-md);
}

.admin-invites__card {
  display: grid;
  gap: 6px;
  align-content: start;
}

.admin-invites__name {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--obw-bone);
}

.admin-invites__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--obw-bone) 72%, var(--obw-stone));
}

/* "Already has an invite": approving re-sends that link instead of a new one. */
.admin-invites__warning {
  margin: 4px 0 0;
  padding: 6px 10px;
  border-left: 2px solid var(--obw-gold);
  font-size: 0.85rem;
  color: var(--obw-gold);
}

.admin-invites__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: var(--obw-space-sm);
}
```

- [ ] **Step 3: Register the route.** In `frontend/src/App.tsx`:
1. Import `AdminInvitesPage` from `@/pages/AdminInvitesPage/index`.
2. Inside the `<Route path="/admin" …>` block, add after the `rsvp` route:

```tsx
                  <Route path="invites" element={<AdminInvitesPage />} />
```

- [ ] **Step 4: Verify.**

Run: `cd frontend && npx tsc -b && npx vitest run`
Expected: both pass.

- [ ] **Step 5: Commit.**

```bash
git add frontend/src
git commit -m "feat(admin): Inviti page with pending requests, approve on WhatsApp and reject

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: "Tutti gli inviti" section with filters, search and send/resend

**Files:**
- Modify: `frontend/src/pages/AdminInvitesPage/AdminInvitesPage.tsx`
- Modify: `frontend/src/pages/AdminInvitesPage/styles/AdminInvitesPage.scss`

**Interfaces:**
- Consumes: `fetchAdminInvites`, `markInviteSent` and `AdminInviteItem` (Task 2); `filterInvites`, `countInvites` and `InviteFilter` (Task 2); `FilterPills` (`@/components/FilterPills`); `SearchBar` (`@/components/SearchBar`); the Task 4 page and its `reload`.
- Produces: the finished page.

- [ ] **Step 1: Load the invites alongside the requests.** In `AdminInvitesPage.tsx`:

1. Imports:
   - add `Send` and `RotateCw` to the lucide import;
   - add `useMemo` to the React import;
   - `import { FilterPills } from '@/components/FilterPills';`
   - `import { SearchBar } from '@/components/SearchBar';`
   - add `fetchAdminInvites` and `type AdminInviteItem` to the `@/services/adminInvitesApi` import;
   - change the `./inviteFilters` import to `import { INVITE_REQUESTS_CHANGED, countInvites, filterInvites, type InviteFilter } from './inviteFilters';`.
2. Add state:

```tsx
  const [invites, setInvites] = useState<AdminInviteItem[]>([]);
  const [filter, setFilter] = useState<InviteFilter>('to_send');
  const [search, setSearch] = useState('');
  const [sendingId, setSendingId] = useState<number | null>(null);
```

3. Make `reload` load both lists. Replace `setRequests(await fetchPendingInviteRequests());` with:

```tsx
      const [nextRequests, nextInvites] = await Promise.all([fetchPendingInviteRequests(), fetchAdminInvites()]);
      setRequests(nextRequests);
      setInvites(nextInvites);
```

4. Derived data:

```tsx
  const counts = useMemo(() => countInvites(invites), [invites]);
  const visibleInvites = useMemo(() => filterInvites(invites, filter, search), [invites, filter, search]);
```

5. Send handler. The link is a real `<a target="_blank">`, so the browser opens WhatsApp from the click itself; this handler only records it:

```tsx
  async function handleSent(invite: AdminInviteItem) {
    setSendingId(invite.id);
    try {
      await markInviteSent(invite.id);
    } catch {
      setError(t('admin.invites.actionFailed'));
    } finally {
      setSendingId(null);
      await reload();
    }
  }

  function answerLabel(invite: AdminInviteItem) {
    if (invite.answer === 'attending') return t('admin.invites.answerAttending');
    if (invite.answer === 'declined') return t('admin.invites.answerDeclined');
    return t('admin.invites.answerNone');
  }
```

- [ ] **Step 2: Render the section.** Insert this right after the closing `</section>` of the requests section, before the reject modal:

```tsx
      <section className="obw-portal-panel admin-invites__section">
        <h2 className="obw-portal-kicker admin-invites__section-title">{t('admin.invites.listTitle')}</h2>
        <FilterPills<InviteFilter>
          options={[
            { id: 'to_send', label: t('admin.invites.filterToSend', { count: counts.to_send }) },
            { id: 'sent', label: t('admin.invites.filterSent', { count: counts.sent }) },
            { id: 'answered', label: t('admin.invites.filterAnswered', { count: counts.answered }) },
          ]}
          active={filter}
          onChange={setFilter}
        />
        <SearchBar value={search} onChange={setSearch} placeholder={t('admin.invites.searchPlaceholder')} />

        {visibleInvites.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.invites.listEmpty')}</p>
        ) : (
          <ul className="admin-invites__list">
            {visibleInvites.map((invite) => (
              <li key={invite.id} className="obw-portal-card admin-invites__row">
                <div className="admin-invites__row-info">
                  <p className="admin-invites__name">{fullName(invite)}</p>
                  <p className="admin-invites__meta">
                    <Phone size={14} aria-hidden />
                    {invite.phone ?? t('admin.invites.noPhone')}
                  </p>
                  <p className="admin-invites__meta">
                    {invite.sent_at
                      ? t('admin.invites.sentOn', { date: formatDate(invite.sent_at) })
                      : t('admin.invites.notSent')}
                    {' · '}
                    {answerLabel(invite)}
                  </p>
                </div>
                <a
                  className={`obw-portal-btn${invite.sent_at ? ' obw-portal-btn--secondary' : ''}`}
                  href={invite.whatsapp_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={sendingId === invite.id}
                  onClick={() => void handleSent(invite)}>
                  {invite.sent_at ? <RotateCw size={14} aria-hidden /> : <Send size={14} aria-hidden />}
                  {invite.sent_at ? t('admin.invites.resend') : t('admin.invites.send')}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
```

- [ ] **Step 3: Add the list styles.** Append to `AdminInvitesPage.scss`:

```scss
.admin-invites__list {
  display: grid;
  gap: var(--obw-space-sm);
  margin: 0;
  padding: 0;
  list-style: none;
}

.admin-invites__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--obw-space-sm);
}

.admin-invites__row-info {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.admin-invites__row .obw-portal-btn {
  text-decoration: none;
}
```

- [ ] **Step 4: Verify.**

Run: `cd frontend && npx tsc -b && npx vitest run`
Expected: both pass.

- [ ] **Step 5: Commit.**

```bash
git add frontend/src/pages/AdminInvitesPage
git commit -m "feat(admin): all-invites list with filters, search and WhatsApp send/resend

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Out of scope (other phases of the spec)

- Phase 4: prefilling `/invito/{token}` from `GET /invites/{token}/rsvp`.
- Phase 5: removing factions.
- Uploading a CSV of invites from the browser. The spec excludes it.
