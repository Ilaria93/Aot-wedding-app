import { createContext, useContext } from 'react';

/** DOM node rendered next to the hero title (see AdminLayout) that a page can
 * portal page-specific stat cards into, so they sit in the same row as the
 * title on desktop instead of stacking below the page content. */
export const AdminHeroStatsSlotContext = createContext<HTMLDivElement | null>(null);

export function useAdminHeroStatsSlot() {
  return useContext(AdminHeroStatsSlotContext);
}
