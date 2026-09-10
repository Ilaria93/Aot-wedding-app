import {
  Armchair,
  Baby,
  Beef,
  ChefHat,
  Leaf,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users,
  Utensils,
  Wheat,
} from 'lucide-react';
import type { ComponentType, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { AdminModal } from '@/components/AdminModal';
import { FilterPills, type FilterPillOption } from '@/components/FilterPills';
import { PageAlert } from '@/components/PageShell';
import { Pagination } from '@/components/Pagination';
import { GuestList } from '@/components/Rsvp/GuestList';
import { SearchBar } from '@/components/SearchBar';
import { StatCards, type StatCardData } from '@/components/StatCards';
import { useI18n } from '@/contexts/I18nContext';
import { useAdminHeroStatsSlot } from '@/layouts/AdminLayout/AdminHeroStatsSlotContext';
import type { TranslateFn } from '@/i18n/translations';
import { getApiErrorMessage } from '@/services/apiErrors';
import {
  assignRsvpTable,
  createAdminTable,
  deleteAdminTable,
  fetchAdminRsvpEntries,
  fetchAdminRsvpStats,
  fetchAdminTables,
  updateAdminTable,
  type AdminRsvpEntry,
  type AdminRsvpEntryFilter,
  type AdminRsvpStats,
  type AdminTable,
} from '@/services/adminDashboardApi';
import type { MealChoiceId } from '@/services/rsvpApi';
import './styles/AdminRsvpPage.scss';

// One card per key RSVP metric.
function buildStatCards(stats: AdminRsvpStats, pendingCount: number, t: TranslateFn): StatCardData[] {
  const totalInvited = stats.total_users;
  const percentOf = (value: number) => (totalInvited > 0 ? Math.round((value / totalInvited) * 100) : 0);

  return [
    {
      id: 'confirmed',
      tone: 'gold',
      label: t('admin.stats.confirmedCard'),
      value: stats.total_attending,
      unit: t('admin.stats.guestsUnit'),
      subtitle: t('admin.stats.confirmedCardSubtitle', { percent: percentOf(stats.total_attending) }),
    },
    {
      id: 'pending',
      tone: 'bone',
      label: t('admin.stats.pendingCard'),
      value: pendingCount,
      unit: t('admin.stats.pendingUnit'),
      subtitle: t('admin.stats.pendingCardSubtitle', { percent: percentOf(pendingCount) }),
    },
    {
      id: 'declined',
      tone: 'stone',
      label: t('admin.stats.declinedCard'),
      value: stats.total_not_attending,
      unit: t('admin.stats.declinedUnit'),
      subtitle: t('admin.stats.declinedCardSubtitle', { percent: percentOf(stats.total_not_attending) }),
    },
    {
      id: 'seats',
      tone: 'bone',
      label: t('admin.stats.totalSeatsCard'),
      value: stats.total_participants,
      unit: t('admin.stats.seatsUnit'),
      subtitle: t('admin.stats.totalSeatsCardSubtitle', { count: stats.total_children }),
      icon: Utensils,
    },
  ];
}

const PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;
const MEAL_CHOICE_SUMMARY_IDS: MealChoiceId[] = ['standard', 'vegetarian', 'vegan', 'gluten_free'];
const MEAL_ICON: Record<MealChoiceId, ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>> = {
  standard: Beef,
  vegetarian: Leaf,
  vegan: Leaf,
  gluten_free: Wheat,
  baby: Baby,
};

type TableUsage = AdminTable & { assignedCount: number };

function partyGuests(entry: AdminRsvpEntry) {
  return [entry.account_holder, ...entry.companions];
}

// Pairs the admin-managed table catalog with how many confirmed guests are
// actually assigned to each one — capacity comes from the catalog, headcount
// from the (paginated-through) entries list.
function computeTableUsage(
  tables: AdminTable[],
  allEntries: AdminRsvpEntry[],
): { tables: TableUsage[]; unassignedCount: number } {
  const assignedByTableId = new Map<number, number>();
  let unassignedCount = 0;
  for (const entry of allEntries) {
    const guestCount = partyGuests(entry).length;
    if (entry.table_id == null) {
      unassignedCount += guestCount;
      continue;
    }
    assignedByTableId.set(entry.table_id, (assignedByTableId.get(entry.table_id) ?? 0) + guestCount);
  }
  return {
    tables: tables.map((table) => ({ ...table, assignedCount: assignedByTableId.get(table.id) ?? 0 })),
    unassignedCount,
  };
}

type TableDraft = { label: string; capacity: string; note: string };

const EMPTY_TABLE_DRAFT: TableDraft = { label: '', capacity: '', note: '' };

/** Admin section — confirmed guests: search, filter, per-party detail, table assignment, and a menu summary. */
export function AdminRsvpPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminRsvpStats | null>(null);
  const [entries, setEntries] = useState<AdminRsvpEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({ all: 0, special_diet: 0, children: 0 });
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [tableUsage, setTableUsage] = useState<{ tables: TableUsage[]; unassignedCount: number }>({
    tables: [],
    unassignedCount: 0,
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AdminRsvpEntryFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningRsvpId, setAssigningRsvpId] = useState<number | null>(null);
  const [newTable, setNewTable] = useState<TableDraft>(EMPTY_TABLE_DRAFT);
  const [creatingTable, setCreatingTable] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const [deletingTable, setDeletingTable] = useState(false);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editingTableDraft, setEditingTableDraft] = useState<TableDraft>(EMPTY_TABLE_DRAFT);
  const [savingTableEdit, setSavingTableEdit] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const [statsResponse, allEntriesFirst, tablesResponse] = await Promise.all([
        fetchAdminRsvpStats(),
        fetchAdminRsvpEntries({ filter: 'all', page: 1, pageSize: 1 }),
        fetchAdminTables(),
      ]);
      setStats(statsResponse);
      setTables(tablesResponse);

      // No server-side table-usage aggregate exists — fetch every confirmed
      // party (page_size caps at 50) and tally it against the catalog client-side.
      // The same full list also gives special_diet/children counts for free
      // (each entry already carries has_special_diet/has_child), so no need
      // for separate count-only requests per filter.
      const pageCount = Math.max(1, Math.ceil(allEntriesFirst.total / MAX_PAGE_SIZE));
      const pages = await Promise.all(
        Array.from({ length: pageCount }, (_, index) =>
          fetchAdminRsvpEntries({ filter: 'all', page: index + 1, pageSize: MAX_PAGE_SIZE }),
        ),
      );
      const allEntries = pages.flatMap((response) => response.items);
      setCounts({
        all: allEntriesFirst.total,
        special_diet: allEntries.filter((entry) => entry.has_special_diet).length,
        children: allEntries.filter((entry) => entry.has_child).length,
      });
      setTableUsage(computeTableUsage(tablesResponse, allEntries));
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.rsvpEntries.loadFailed')));
    }
  }, [t]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchAdminRsvpEntries({ search, filter, page, pageSize: PAGE_SIZE })
        .then((response) => {
          if (!active) return;
          setError(null);
          setEntries(response.items);
          setTotal(response.total);
        })
        .catch((caughtError) => {
          if (!active) return;
          setError(getApiErrorMessage(caughtError, t('admin.rsvpEntries.loadFailed')));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [search, filter, page, t]);

  function handleFilterChange(nextFilter: AdminRsvpEntryFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleAssignTableChange(rsvpId: number, rawValue: string) {
    const tableId = rawValue === '' ? null : Number(rawValue);
    setAssigningRsvpId(rsvpId);
    try {
      await assignRsvpTable(rsvpId, tableId);
      const assignedTable = tableId != null ? tables.find((table) => table.id === tableId) : undefined;
      setEntries((prev) =>
        prev.map((entry) =>
          entry.rsvp_id === rsvpId ? { ...entry, table_id: tableId, table_label: assignedTable?.label ?? null } : entry,
        ),
      );
      void loadSummary();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.rsvpEntries.loadFailed')));
    } finally {
      setAssigningRsvpId(null);
    }
  }

  async function handleCreateTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const capacityNumber = Number(newTable.capacity);
    if (!newTable.label.trim() || !capacityNumber || capacityNumber <= 0) return;

    setCreatingTable(true);
    try {
      await createAdminTable({
        label: newTable.label.trim(),
        capacity: capacityNumber,
        note: newTable.note.trim() || null,
      });
      setNewTable(EMPTY_TABLE_DRAFT);
      setIsAddTableModalOpen(false);
      void loadSummary();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.rsvpEntries.loadFailed')));
    } finally {
      setCreatingTable(false);
    }
  }

  function startEditTable(table: AdminTable) {
    setEditingTableId(table.id);
    setEditingTableDraft({ label: table.label, capacity: String(table.capacity), note: table.note ?? '' });
  }

  function cancelEditTable() {
    setEditingTableId(null);
    setEditingTableDraft(EMPTY_TABLE_DRAFT);
  }

  async function saveEditTable(tableId: number) {
    const capacityNumber = Number(editingTableDraft.capacity);
    if (!editingTableDraft.label.trim() || !capacityNumber || capacityNumber <= 0) return;

    setSavingTableEdit(true);
    try {
      await updateAdminTable(tableId, {
        label: editingTableDraft.label.trim(),
        capacity: capacityNumber,
        note: editingTableDraft.note.trim() || null,
      });
      setEditingTableId(null);
      void loadSummary();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.rsvpEntries.loadFailed')));
    } finally {
      setSavingTableEdit(false);
    }
  }

  function closeAddTableModal() {
    setIsAddTableModalOpen(false);
    setNewTable(EMPTY_TABLE_DRAFT);
  }

  function requestDeleteTable(table: AdminTable) {
    setDeleteTarget({ id: table.id, label: table.label });
  }

  function cancelDeleteTable() {
    setDeleteTarget(null);
  }

  async function confirmDeleteTable() {
    if (!deleteTarget) return;
    setDeletingTable(true);
    try {
      await deleteAdminTable(deleteTarget.id);
      setDeleteTarget(null);
      void loadSummary();
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.rsvpEntries.tableDeleteFailed')));
    } finally {
      setDeletingTable(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingCount = stats ? Math.max(0, stats.total_users - stats.total_confirmed) : 0;

  const menuSummary = useMemo(
    () => MEAL_CHOICE_SUMMARY_IDS.map((mealId) => ({ mealId, count: stats?.by_meal_choice?.[mealId] ?? 0 })),
    [stats],
  );

  const statCards = useMemo(() => (stats ? buildStatCards(stats, pendingCount, t) : []), [stats, pendingCount, t]);
  const heroStatsSlot = useAdminHeroStatsSlot();

  const filterOptions: FilterPillOption<AdminRsvpEntryFilter>[] = [
    { id: 'all', label: t('admin.rsvpEntries.filterAll', { count: counts.all }), icon: Users },
    { id: 'special_diet', label: t('admin.rsvpEntries.filterSpecialDiet', { count: counts.special_diet }), icon: Utensils },
    { id: 'children', label: t('admin.rsvpEntries.filterChildren', { count: counts.children }), icon: Baby },
  ];

  return (
    <>
      {statCards.length > 0 && heroStatsSlot ? createPortal(<StatCards cards={statCards} />, heroStatsSlot) : null}

      <section className="obw-portal-panel admin-rsvp__toolbar">
        <span className="obw-portal-kicker admin-rsvp__toolbar-label">{t('admin.rsvpEntries.searchLabel')}</span>
        <FilterPills options={filterOptions} active={filter} onChange={handleFilterChange} />
        <SearchBar value={search} onChange={handleSearchChange} placeholder={t('admin.rsvpEntries.searchPlaceholder')} />
      </section>

      <div className="admin-rsvp__layout">
        <section className="admin-rsvp__list">
          <div className="admin-rsvp__section-header">
            <h2 className="admin-rsvp__section-title">
              <Shield size={17} aria-hidden />
              {t('admin.rsvpEntries.sectionTitle')}
            </h2>
            <span className="admin-rsvp__section-count">
              {t('admin.rsvpEntries.viewedOfConfirmed', { shown: entries.length, total: counts.all })}
            </span>
          </div>

          {error ? <PageAlert message={error} /> : null}

          {loading ? (
            <p className="obw-body obw-body--flush">{t('common.loading')}</p>
          ) : entries.length === 0 ? (
            <p className="obw-body obw-body--flush admin-rsvp__empty">{t('admin.rsvpEntries.empty')}</p>
          ) : (
              <>
                <GuestList
                  entries={entries}
                  tables={tables}
                  assigningRsvpId={assigningRsvpId}
                  onAssignTable={handleAssignTableChange}
                  t={t}
                />

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  label={t('admin.rsvpEntries.pageOf', { page, totalPages })}
                  prevLabel={t('admin.rsvpEntries.prevPage')}
                  nextLabel={t('admin.rsvpEntries.nextPage')}
                  onChange={setPage}
                />
              </>
            )}
        </section>

        <aside className="admin-rsvp__sidebar">
          <section className="admin-rsvp__table-panel">
            <div className="admin-rsvp__table-panel-head">
              <span className="admin-rsvp__table-panel-kicker">{t('admin.rsvpEntries.tableSeatsKicker')}</span>
              <div className="admin-rsvp__table-panel-title-wrap">
                <Armchair className="admin-rsvp__table-panel-icon" aria-hidden />
                <h2>{t('admin.rsvpEntries.tableGroupsTitle')}</h2>
              </div>
            </div>

            <div className="admin-rsvp__tables-list">
              {tableUsage.tables.length === 0 && tableUsage.unassignedCount === 0 ? (
                <p className="obw-body obw-body--flush admin-rsvp__empty">{t('admin.rsvpEntries.tableGroupsEmpty')}</p>
              ) : (
                <>
                  {tableUsage.tables.map((table) => {
                    if (editingTableId === table.id) {
                      return (
                        <div key={table.id} className="admin-rsvp__table-edit-row">
                          <input
                            className="admin-rsvp__new-table-input"
                            type="text"
                            value={editingTableDraft.label}
                            onChange={(event) =>
                              setEditingTableDraft((prev) => ({ ...prev, label: event.target.value }))
                            }
                          />
                          <input
                            className="admin-rsvp__new-table-input admin-rsvp__new-table-input--capacity"
                            type="number"
                            min={1}
                            value={editingTableDraft.capacity}
                            onChange={(event) =>
                              setEditingTableDraft((prev) => ({ ...prev, capacity: event.target.value }))
                            }
                          />
                          <input
                            className="admin-rsvp__new-table-input"
                            type="text"
                            placeholder={t('admin.rsvpEntries.newTableNotePlaceholder')}
                            value={editingTableDraft.note}
                            onChange={(event) =>
                              setEditingTableDraft((prev) => ({ ...prev, note: event.target.value }))
                            }
                          />
                          <div className="admin-rsvp__table-edit-actions">
                            <button
                              type="button"
                              className="obw-portal-btn obw-portal-btn--secondary"
                              disabled={savingTableEdit}
                              onClick={() => void saveEditTable(table.id)}>
                              {t('common.save')}
                            </button>
                            <button
                              type="button"
                              className="obw-portal-btn obw-portal-btn--secondary"
                              disabled={savingTableEdit}
                              onClick={cancelEditTable}>
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              className="admin-rsvp__table-edit-delete"
                              disabled={savingTableEdit}
                              onClick={() => requestDeleteTable(table)}>
                              <Trash2 size={13} aria-hidden />
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const percent =
                      table.capacity > 0 ? Math.min(100, Math.round((table.assignedCount / table.capacity) * 100)) : 0;
                    const isFull = table.assignedCount >= table.capacity;

                    return (
                      <div key={table.id} className={`admin-rsvp__table-row${isFull ? ' is-full' : ''}`}>
                        <div className="admin-rsvp__table-row-title">
                          <span className="admin-rsvp__table-name">{table.label}</span>
                          <span className="admin-rsvp__table-counter">
                            {isFull
                              ? t('admin.rsvpEntries.tableSeatsOfComplete', {
                                  assigned: table.assignedCount,
                                  capacity: table.capacity,
                                })
                              : t('admin.rsvpEntries.tableSeatsOf', {
                                  assigned: table.assignedCount,
                                  capacity: table.capacity,
                                  percent,
                                })}
                          </span>
                        </div>
                        <div className="admin-rsvp__progress-row">
                          <div className="admin-rsvp__progress-track">
                            <div className="admin-rsvp__progress-fill" style={{ width: `${percent}%` }} />
                          </div>
                          <button
                            type="button"
                            className="admin-rsvp__table-edit-btn"
                            aria-label={t('common.edit')}
                            onClick={() => startEditTable(table)}>
                            <Pencil size={12} aria-hidden />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {tableUsage.unassignedCount > 0 ? (
                    <div className="admin-rsvp__table-row">
                      <div className="admin-rsvp__table-row-title">
                        <span className="admin-rsvp__table-name">{t('admin.rsvpEntries.tableUnassignedLabel')}</span>
                        <span className="admin-rsvp__table-counter">{tableUsage.unassignedCount}</span>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <button
              type="button"
              className="admin-rsvp__map-button"
              onClick={() => setIsAddTableModalOpen(true)}>
              <Plus size={17} strokeWidth={2} aria-hidden />
              <span>{t('admin.rsvpEntries.addTableButton')}</span>
            </button>
          </section>

          <section className="admin-rsvp__menu-panel">
            <div className="admin-rsvp__menu-panel-head">
              <div className="admin-rsvp__menu-panel-title-wrap">
                <ChefHat className="admin-rsvp__menu-panel-icon" size={27} strokeWidth={1.8} aria-hidden />
                <h2>{t('admin.rsvpEntries.menuSummaryTitle')}</h2>
              </div>
              <span className="admin-rsvp__kitchen-label">{t('admin.rsvpEntries.kitchenKicker')}</span>
            </div>

            <div className="admin-rsvp__menu-grid">
              {menuSummary.map(({ mealId, count }) => {
                const MealIcon = MEAL_ICON[mealId];
                return (
                  <div className="admin-rsvp__menu-item" key={mealId}>
                    <div className="admin-rsvp__menu-item-label">
                      <MealIcon size={18} strokeWidth={1.8} aria-hidden />
                      <span>{t(`rsvp.mealChoices.${mealId}`)}</span>
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })}
            </div>

            <div className="admin-rsvp__children-row">
              <div className="admin-rsvp__children-label">
                <Baby size={18} aria-hidden />
                <span>{t('admin.rsvpEntries.childrenSummaryLabel')}</span>
              </div>
              <strong>{stats?.by_meal_choice?.baby ?? 0}</strong>
            </div>
          </section>
        </aside>
      </div>

      {isAddTableModalOpen ? (
        <AdminModal titleId="admin-rsvp-add-table-title" title={t('admin.rsvpEntries.newTableCardTitle')} onClose={closeAddTableModal} t={t}>
          <form className="admin-rsvp__new-table-form" onSubmit={handleCreateTable}>
            <input
              className="admin-rsvp__new-table-input"
              type="text"
              autoFocus
              placeholder={t('admin.rsvpEntries.newTableLabelPlaceholder')}
              value={newTable.label}
              onChange={(event) => setNewTable((prev) => ({ ...prev, label: event.target.value }))}
            />
            <input
              className="admin-rsvp__new-table-input admin-rsvp__new-table-input--capacity"
              type="number"
              min={1}
              placeholder={t('admin.rsvpEntries.newTableCapacityPlaceholder')}
              value={newTable.capacity}
              onChange={(event) => setNewTable((prev) => ({ ...prev, capacity: event.target.value }))}
            />
            <input
              className="admin-rsvp__new-table-input"
              type="text"
              placeholder={t('admin.rsvpEntries.newTableNotePlaceholder')}
              value={newTable.note}
              onChange={(event) => setNewTable((prev) => ({ ...prev, note: event.target.value }))}
            />
            <div className="admin-modal__actions">
              <button type="submit" className="admin-rsvp__new-table-submit" disabled={creatingTable}>
                <Plus size={14} aria-hidden />
                {t('admin.rsvpEntries.newTableSubmit')}
              </button>
              <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={closeAddTableModal}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}

      {deleteTarget ? (
        <AdminModal
          titleId="admin-rsvp-delete-table-title"
          title={t('admin.rsvpEntries.deleteTableConfirm')}
          role="alertdialog"
          onClose={cancelDeleteTable}
          t={t}>
          <p className="admin-modal__body">
            {t('admin.rsvpEntries.deleteTableConfirmBody', { label: deleteTarget.label })}
          </p>
          <div className="admin-modal__actions">
            <button
              type="button"
              className="admin-rsvp__table-edit-delete"
              disabled={deletingTable}
              onClick={() => void confirmDeleteTable()}>
              <Trash2 size={14} aria-hidden />
              {t('common.delete')}
            </button>
            <button
              type="button"
              className="obw-portal-btn obw-portal-btn--secondary"
              disabled={deletingTable}
              onClick={cancelDeleteTable}>
              {t('common.cancel')}
            </button>
          </div>
        </AdminModal>
      ) : null}
    </>
  );
}
