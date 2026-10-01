import { useRef, useState } from 'react';

import { AdminModal } from '@/components/AdminModal';
import { useI18n } from '@/contexts/I18nContext';
import { importInvitesCsv, type ImportReport } from '@/services/adminInvitesApi';

type InviteImportDialogProps = {
  onClose: () => void;
  onImported: () => Promise<void> | void;
};

/** Loads the guest-list CSV (same format as scripts/generate_invite_links.py). */
export function InviteImportDialog({ onClose, onImported }: InviteImportDialogProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [failed, setFailed] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setFailed(false);
    setReport(null);
    try {
      setReport(await importInvitesCsv(file));
      await onImported();
    } catch {
      setFailed(true);
    } finally {
      setImporting(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <AdminModal titleId="invite-import-title" title={t('admin.invites.importTitle')} size="md" onClose={onClose} t={t}>
      <p className="admin-modal__body">{t('admin.invites.importHelp')}</p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <div className="admin-modal__actions">
        <button type="button" className="obw-portal-btn" disabled={importing} onClick={() => inputRef.current?.click()}>
          {importing ? t('admin.invites.importing') : t('admin.invites.importChoose')}
        </button>
        <button type="button" className="obw-portal-btn obw-portal-btn--secondary" onClick={onClose}>
          {t('admin.invites.close')}
        </button>
      </div>

      {failed ? (
        <p className="invite-form__message" role="alert">
          {t('admin.invites.importFailed')}
        </p>
      ) : null}
      {report ? (
        <div className="invite-import__report" role="status">
          <p>
            {t('admin.invites.importDone', {
              created: report.created,
              skipped: report.skipped_duplicates.length,
              errors: report.errors.length,
            })}
          </p>
          {report.skipped_duplicates.length > 0 ? (
            <p>{t('admin.invites.importSkipped', { names: report.skipped_duplicates.join(', ') })}</p>
          ) : null}
          {report.errors.length > 0 ? (
            <ul>
              {report.errors.map((error) => (
                <li key={`${error.row}-${error.reason}`}>
                  {t('admin.invites.importRow', { row: error.row, reason: error.reason })}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </AdminModal>
  );
}
