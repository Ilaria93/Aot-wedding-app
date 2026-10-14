import { Baby, ChevronDown, StickyNote, UserX, Users, Utensils } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";

import { type TranslateFn } from "@/i18n/translations";
import { type AdminRsvpEntry, type AdminRsvpEntryFilter, type AdminTable } from "@/services/adminDashboardApi";
import { MEAL_TAG_TONE } from "@/components/Rsvp/constants";
import { guestsMatching, partyGuests } from "@/components/Rsvp/guestFilters";


interface GuestListProps {
  entries: AdminRsvpEntry[];
  /** Which people of each party get a card: everyone, only special diets, or only children. */
  filter: AdminRsvpEntryFilter;
  tables: AdminTable[];
  assigningRsvpId: number | null;
  onAssignTable: (rsvpId: number, tableId: string) => void;
  t: TranslateFn;
}


function formatGuestName(guest: { first_name: string; last_name: string }): string {
  return `${guest.first_name} ${guest.last_name}`.trim();
}


type MetaTone = "muted" | "gold" | "green" | "blue";
type MetaItem = {
  key: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  text: string;
  tone: MetaTone;
};

type Guest = AdminRsvpEntry["account_holder"];

// One inline row per person: who they come with, what they eat (diet, allergy, notes) and whether they are a child.
// Each person has their own card because their needs can differ; the table is the party's, shared by its cards.
function buildMetaItems(entry: AdminRsvpEntry, guest: Guest, isHolder: boolean, t: TranslateFn): MetaItem[] {
  const items: MetaItem[] = [];

  if (!isHolder) {
    items.push({
      key: "with",
      icon: Users,
      text: t("admin.rsvpEntries.withHolder", { value: formatGuestName(entry.account_holder) }),
      tone: "gold",
    });
  } else if (entry.companions.length > 0) {
    items.push({
      key: "companions",
      icon: Users,
      text: t("admin.rsvpEntries.companionsLabel", {
        value:
          entry.companions.length > 1
            ? `${formatGuestName(entry.companions[0])} (+${entry.companions.length - 1})`
            : formatGuestName(entry.companions[0]),
      }),
      tone: "gold",
    });
  } else {
    items.push({ key: "companions", icon: UserX, text: t("admin.rsvpEntries.noCompanions"), tone: "muted" });
  }

  items.push({
    key: "meal",
    icon: Utensils,
    text: t(`rsvp.mealChoices.${guest.meal_choice}`),
    tone: guest.meal_choice === "standard" ? "muted" : MEAL_TAG_TONE[guest.meal_choice] === "green" ? "green" : "gold",
  });

  if (guest.intolerance !== "none") {
    items.push({ key: "intolerance", icon: Utensils, text: t(`rsvp.intolerances.${guest.intolerance}`), tone: "gold" });
  }

  if (guest.dietary_notes) {
    items.push({ key: "note", icon: StickyNote, text: t("admin.rsvpEntries.notesLabel", { value: guest.dietary_notes }), tone: "gold" });
  }

  if (guest.is_child) {
    items.push({ key: "child", icon: Baby, text: t("admin.rsvpEntries.childTag"), tone: "blue" });
  }

  return items;
}


export function GuestList({ entries, filter, tables, assigningRsvpId, onAssignTable, t }: GuestListProps) {
  // Only one row's table menu is ever open — a single ref to that wrapper is
  // enough to detect an outside click and close it.
  const [openCardKey, setOpenCardKey] = useState<string | null>(null);
  const openFieldRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (openCardKey === null) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (openFieldRef.current && !openFieldRef.current.contains(event.target as Node)) {
        setOpenCardKey(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenCardKey(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCardKey]);

  function selectTable(rsvpId: number, tableId: string) {
    onAssignTable(rsvpId, tableId);
    setOpenCardKey(null);
  }

  return (
    <>
      {entries.flatMap((entry) =>
        partyGuests(entry).flatMap((guest, index) => {
        if (!guestsMatching(entry, filter).includes(guest)) return [];
        const cardKey = `${entry.rsvp_id}-${index}`;
        const metaItems = buildMetaItems(entry, guest, index === 0, t);
        const isOpen = openCardKey === cardKey;

        return (
          <article key={cardKey} className="obw-portal-panel admin-rsvp__guest-card">
            <div className="admin-rsvp__guest-main">
              <div className="admin-rsvp__guest-name-row">
                <div className="admin-rsvp__guest-name-group">
                  <span className="admin-rsvp__avatar" aria-hidden>
                    {guest.first_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="admin-rsvp__guest-name">{formatGuestName(guest)}</span>
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
                    onClick={() => setOpenCardKey(isOpen ? null : cardKey)}
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
        }),
      )}
    </>
  );
}
