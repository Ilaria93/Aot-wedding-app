import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';

import { useI18n } from '@/contexts/I18nContext';
import type { AdminTable, StaffGuest } from '@/services/adminDashboardApi';

type StaffGuestsPanelProps = {
  staff: StaffGuest[];
  tables: AdminTable[];
  onAdd: () => void;
  onEdit: (guest: StaffGuest) => void;
  onDelete: (guest: StaffGuest) => void;
  onAssignTable: (guest: StaffGuest, tableId: number | null) => void;
};

/** Suppliers' people (band, photographer...) who eat at the reception: counted in the meals and the tables. */
export function StaffGuestsPanel({ staff, tables, onAdd, onEdit, onDelete, onAssignTable }: StaffGuestsPanelProps) {
  const { t } = useI18n();

  return (
    <section className="admin-rsvp__table-panel admin-rsvp__staff-panel">
      <div className="admin-rsvp__table-panel-head">
        <span className="admin-rsvp__table-panel-kicker">{t('admin.staff.kicker')}</span>
        <div className="admin-rsvp__table-panel-title-wrap">
          <UtensilsCrossed className="admin-rsvp__table-panel-icon" aria-hidden />
          <h2>{t('admin.staff.title')}</h2>
        </div>
        <p className="admin-rsvp__staff-hint">{t('admin.staff.hint')}</p>
      </div>

      {staff.length === 0 ? (
        <p className="obw-body obw-body--flush admin-rsvp__empty">{t('admin.staff.empty')}</p>
      ) : (
        <ul className="admin-rsvp__staff-list">
          {staff.map((guest) => (
            <li key={guest.id} className="admin-rsvp__staff-row">
              <div className="admin-rsvp__staff-info">
                <span className="admin-rsvp__table-name">{guest.name}</span>
                <span className="admin-rsvp__staff-meta">
                  {[guest.role, t(`rsvp.mealChoices.${guest.meal_choice}`)].filter(Boolean).join(' · ')}
                  {guest.intolerance !== 'none' ? ` · ${t(`rsvp.intolerances.${guest.intolerance}`)}` : ''}
                </span>
                {guest.dietary_notes ? <span className="admin-rsvp__staff-meta">{guest.dietary_notes}</span> : null}
              </div>
              <div className="admin-rsvp__staff-actions">
                <select
                  className="admin-rsvp__new-table-input"
                  aria-label={t('admin.staff.table')}
                  value={guest.table_id ?? ''}
                  onChange={(event) => onAssignTable(guest, event.target.value === '' ? null : Number(event.target.value))}>
                  <option value="">{t('admin.staff.noTable')}</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="admin-rsvp__table-edit-btn"
                  aria-label={t('common.edit')}
                  onClick={() => onEdit(guest)}>
                  <Pencil size={12} aria-hidden />
                </button>
                <button
                  type="button"
                  className="admin-rsvp__table-edit-btn"
                  aria-label={t('common.delete')}
                  onClick={() => onDelete(guest)}>
                  <Trash2 size={12} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="admin-rsvp__map-button" onClick={onAdd}>
        <Plus size={17} strokeWidth={2} aria-hidden />
        <span>{t('admin.staff.addButton')}</span>
      </button>
    </section>
  );
}
