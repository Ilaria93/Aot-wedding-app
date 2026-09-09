import { Info, MessageCircle, Phone } from 'lucide-react';
import type { ComponentType } from 'react';

export type SupplierCardTone = 'green' | 'amber' | 'rose';

type SupplierCardIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;

export type SupplierCardInfoItem = {
  icon: SupplierCardIcon;
  text: string;
};

export type SupplierCardAction = {
  label: string;
  url: string;
};

type SupplierCardProps = {
  categoryLabel: string;
  statusLabel: string;
  statusTone: SupplierCardTone;
  title: string;
  roleLabel: string;
  roleName: string;
  infoItems: SupplierCardInfoItem[];
  note?: string | null;
  callAction?: SupplierCardAction;
  messageAction?: SupplierCardAction;
};

// Same dark-panel/gold-corner language as .admin-rsvp__table-panel — one
// card per wedding supplier, with the fields that vary per booking:
// category + status, who to ask for, and any handoff note for that vendor.
export function SupplierCard({
  categoryLabel,
  statusLabel,
  statusTone,
  title,
  roleLabel,
  roleName,
  infoItems,
  note,
  callAction,
  messageAction,
}: SupplierCardProps) {
  return (
    <article className="admin-contacts__supplier-card">
      <div className="admin-contacts__supplier-head">
        <div className="admin-contacts__supplier-badges">
          <span className="admin-contacts__supplier-pill admin-contacts__supplier-pill--category">{categoryLabel}</span>
          <span
            className={`admin-contacts__supplier-pill admin-contacts__supplier-pill--status admin-contacts__supplier-pill--${statusTone}`}>
            <span className="admin-contacts__supplier-status-dot" aria-hidden />
            {statusLabel}
          </span>
        </div>
        <div className="admin-contacts__supplier-actions">
          {callAction ? (
            <a className="admin-contacts__supplier-icon-btn" href={callAction.url} aria-label={callAction.label}>
              <Phone size={16} aria-hidden />
            </a>
          ) : null}
          {messageAction ? (
            <a className="admin-contacts__supplier-icon-btn" href={messageAction.url} aria-label={messageAction.label}>
              <MessageCircle size={16} aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      <h3 className="admin-contacts__supplier-title">{title}</h3>
      <p className="admin-contacts__supplier-role">
        {roleLabel}: <strong>{roleName}</strong>
      </p>

      {infoItems.length > 0 ? (
        <>
          <hr className="admin-contacts__supplier-divider" />
          <div className="admin-contacts__supplier-info-row">
            {infoItems.map((item, index) => (
              <span className="admin-contacts__supplier-info-item" key={index}>
                <item.icon size={14} aria-hidden />
                {item.text}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {note ? (
        <div className="admin-contacts__supplier-note">
          <Info size={14} aria-hidden />
          <span>{note}</span>
        </div>
      ) : null}
    </article>
  );
}
