import { Outlet } from 'react-router-dom';

import { AppTopBar } from '@/components/AppTopBar';
import './styles/AppLayout.scss';

/** App shell with a single sticky header for navigation. */
export function AppLayout() {
  return (
    <>
      <AppTopBar />
      <main className="app-main">
        <Outlet />
      </main>
    </>
  );
}
