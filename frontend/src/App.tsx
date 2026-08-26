import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/components/AuthGuard/index';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { AppLayout } from '@/layouts/AppLayout/index';
import { AuthStackLayout } from '@/layouts/AuthStackLayout/index';
import { AdminPage } from '@/pages/AdminPage/index';
import { AlbumPage } from '@/pages/AlbumPage/index';
import { GuestAccessRecoveryPage } from '@/pages/GuestAccessRecoveryPage/index';
import { GuestAccessVerifyPage } from '@/pages/GuestAccessVerifyPage/index';
import { GuestRsvpPage } from '@/pages/GuestRsvpPage/index';
import { HomePage } from '@/pages/HomePage/index';
import { InvitePage } from '@/pages/InvitePage/index';
import { LoginPage } from '@/pages/LoginPage/index';
import { NotFoundPage } from '@/pages/NotFoundPage/index';
import { ProfilePage } from '@/pages/ProfilePage/index';
import { RegisterPage } from '@/pages/RegisterPage/index';
import { RsvpPage } from '@/pages/RsvpPage/index';
import { StarCrawlPreviewPage } from '@/pages/StarCrawlPreviewPage/index';
import { TravelPage } from '@/pages/TravelPage/index';

/** Root router for the Vite web app. */
export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route element={<AuthStackLayout />}>
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/album" element={<AlbumPage />} />
                <Route path="/rsvp" element={<RsvpPage />} />
                <Route path="/travel" element={<TravelPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              {/* Standalone, no topbar/back-button chrome — same reasoning as NotFoundPage below. */}
              <Route path="/invito/:token" element={<InvitePage />} />
              <Route path="/invito/:token/rsvp" element={<GuestRsvpPage />} />
              <Route path="/accedi/verifica" element={<GuestAccessVerifyPage />} />
              <Route path="/accedi/recupera" element={<GuestAccessRecoveryPage />} />

              {/* Dev-only preview, never built in production — see DEV_PUBLIC_PATHS
                  in authRouteAccess.ts and docs/deferred/star-crawl.md. */}
              {import.meta.env.DEV ? (
                <Route path="/dev/star-crawl" element={<StarCrawlPreviewPage />} />
              ) : null}

              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
