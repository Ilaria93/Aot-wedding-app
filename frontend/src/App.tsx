import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/components/AuthGuard/index';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { AdminLayout } from '@/layouts/AdminLayout/index';
import { AppLayout } from '@/layouts/AppLayout/index';
import { AuthStackLayout } from '@/layouts/AuthStackLayout/index';
import { AdminContactsPage } from '@/pages/AdminContactsPage/index';
import { AdminGalleryPage } from '@/pages/AdminGalleryPage/index';
import { AdminRsvpPage } from '@/pages/AdminRsvpPage/index';
import { AlbumPage } from '@/pages/AlbumPage/index';
import { GuestRsvpPage } from '@/pages/GuestRsvpPage/index';
import { HomePage } from '@/pages/HomePage/index';
import { InvitePage } from '@/pages/InvitePage/index';
import { LoginPage } from '@/pages/LoginPage/index';
import { NotFoundPage } from '@/pages/NotFoundPage/index';
import { ProfilePage } from '@/pages/ProfilePage/index';
import { RsvpPage } from '@/pages/RsvpPage/index';
import { TemaPage } from '@/pages/TemaPage/index';
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
              </Route>

              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/album" element={<AlbumPage />} />
                <Route path="/rsvp" element={<RsvpPage />} />
                <Route path="/travel" element={<TravelPage />} />
                <Route path="/tema" element={<TemaPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/rsvp" replace />} />
                  <Route path="rsvp" element={<AdminRsvpPage />} />
                  <Route path="contacts" element={<AdminContactsPage />} />
                  <Route path="gallery" element={<AdminGalleryPage />} />
                </Route>
              </Route>

              {/* Standalone, no topbar/back-button chrome — same reasoning as NotFoundPage below. */}
              <Route path="/invito/:token" element={<InvitePage />} />
              <Route path="/invito/:token/rsvp" element={<GuestRsvpPage />} />

              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
