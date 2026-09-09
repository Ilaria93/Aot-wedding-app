import { Baby, ChevronDown, StickyNote, UserX, Users, Utensils } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";

import { type TranslateFn } from "@/i18n/translations";
import { type AdminRsvpEntry, type AdminTable } from "@/services/adminDashboardApi";
import { MEAL_TAG_TONE } from "@/components/Rsvp/constants";


interface GuestListProps {
  entries: AdminRsvpEntry[];
  tables: AdminTable[];
  assigningRsvpId: number | null;
  onAssignTable: (rsvpId: number, tableId: string) => void;
  t: TranslateFn;
}


function formatGuestName(guest: { first_name: string; last_name: string }): string {
  return `${guest.first_name} ${guest.last_name}`.trim();
}


function partyGuests(entry: AdminRsvpEntry) {
  return [entry.account_holder, ...entry.companions];
}


type MetaTone = "muted" | "gold" | "green" | "blue";
type MetaItem = {
  key: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  text: string;
  tone: MetaTone;
};

// One inline row per guest card — companions, table, and every diet/allergy/
// note the party carries, using only the data the entry already has.
function buildMetaItems(entry: AdminRsvpEntry, t: TranslateFn): MetaItem[] {
  const guests = partyGuests(entry);
  const items: MetaItem[] = [];

  items.push(
    entry.companions.length > 0
      ? {
          key: "companions",
          icon: Users,
          text: t("admin.rsvpEntries.companionsLabel", {
            value:
              entry.companions.length > 1
                ? `${formatGuestName(entry.companions[0])} (+${entry.companions.length - 1})`
                : formatGuestName(entry.companions[0]),
          }),
          tone: "gold",
        }
      : { key: "companions", icon: UserX, text: t("admin.rsvpEntries.noCompanions"), tone: "muted" },
  );

  const mealTags = Array.from(new Set(guests.map((guest) => guest.meal_choice)));
  if (mealTags.length === 1 && mealTags[0] === "standard") {
    items.push({ key: "meal-standard", icon: Utensils, text: t("rsvp.mealChoices.standard"), tone: "muted" });
  } else {
    for (const mealId of mealTags) {
      if (mealId === "standard") continue;
      items.push({
        key: `meal-${mealId}`,
        icon: Utensils,
        text: t(`rsvp.mealChoices.${mealId}`),
        tone: MEAL_TAG_TONE[mealId] === "green" ? "green" : "gold",
      });
    }
  }

  const intoleranceTags = Array.from(
    new Set(guests.map((guest) => guest.intolerance).filter((value) => value !== "none")),
  );
  for (const intoleranceId of intoleranceTags) {
    items.push({
      key: `intolerance-${intoleranceId}`,
      icon: Utensils,
      text: t(`rsvp.intolerances.${intoleranceId}`),
      tone: "gold",
    });
  }

  const noteTags = Array.from(
    new Set(guests.map((guest) => guest.dietary_notes).filter((value): value is string => Boolean(value))),
  );
  for (const note of noteTags) {
    items.push({ key: `note-${note}`, icon: StickyNote, text: t("admin.rsvpEntries.notesLabel", { value: note }), tone: "gold" });
  }

  if (entry.has_child) {
    items.push({ key: "child", icon: Baby, text: t("admin.rsvpEntries.childTag"), tone: "blue" });
  }

  return items;
}


export function GuestList({ entries, tables, assigningRsvpId, onAssignTable, t }: GuestListProps) {
  // Only one row's table menu is ever open — a single ref to that wrapper is
  // enough to detect an outside click and close it.
  const [openRsvpId, setOpenRsvpId] = useState<number | null>(null);
  const openFieldRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (openRsvpId === null) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (openFieldRef.current && !openFieldRef.current.contains(event.target as Node)) {
        setOpenRsvpId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenRsvpId(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openRsvpId]);

  function selectTable(rsvpId: number, tableId: string) {
    onAssignTable(rsvpId, tableId);
    setOpenRsvpId(null);
  }

  return (
    <>
      {entries.map((entry) => {
        const metaItems = buildMetaItems(entry, t);
        const isOpen = openRsvpId === entry.rsvp_id;

        return (
          <article key={entry.user_id} className="obw-portal-panel admin-rsvp__guest-card">
            <div className="admin-rsvp__guest-main">
              <div className="admin-rsvp__guest-name-row">
                <div className="admin-rsvp__guest-name-group">
                  <span className="admin-rsvp__avatar" aria-hidden>
                    {entry.account_holder.first_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="admin-rsvp__guest-name">{formatGuestName(entry.account_holder)}</span>
                </div>
                <span className="admin-rsvp__confirmed-badge">
                  <span className="admin-rsvp__confirmed-dot" aria-hidden />
                  {t("admin.rsvpEntries.confirmedBadge")}
                </span>
              </div>

              <div className="admin-rsvp__guest-meta-row">
                {metaItems.map((item) => (
                  <span key={item.key} className={`admin-rsvp__guest-meta admin-rsvp__guest-meta--${item.tone}`}>
                    <item.icon size={13} aria-hidden />
                    {item.text}
                  </span>
                ))}

                <span
                  className={`admin-rsvp__guest-meta admin-rsvp__table-field${isOpen ? ' is-open' : ''}`}
                  ref={isOpen ? openFieldRef : undefined}
                >
                  <button
                    type="button"
                    className="admin-rsvp__table-display"
                    disabled={assigningRsvpId === entry.rsvp_id}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    onClick={() => setOpenRsvpId(isOpen ? null : entry.rsvp_id)}
                  >
                    {entry.table_label ?? t("admin.rsvpEntries.assignTableButton")}
                    <ChevronDown size={13} className="admin-rsvp__table-chevron" aria-hidden />
                  </button>

                  {isOpen ? (
                    <ul className="admin-rsvp__table-menu" role="listbox">
                      <li
                        role="option"
                        aria-selected={!entry.table_id}
                        className={`admin-rsvp__table-menu-item${!entry.table_id ? ' is-selected' : ''}`}
                        onClick={() => selectTable(entry.rsvp_id, '')}
                      >
                        {t("admin.rsvpEntries.assignTableButton")}
                      </li>
                      {tables.map((table) => (
                        <li
                          key={table.id}
                          role="option"
                          aria-selected={entry.table_id === table.id}
                          className={`admin-rsvp__table-menu-item${entry.table_id === table.id ? ' is-selected' : ''}`}
                          onClick={() => selectTable(entry.rsvp_id, String(table.id))}
                        >
                          {table.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}
