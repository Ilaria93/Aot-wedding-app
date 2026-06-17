import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/components/AuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { AppLayout } from '@/layouts/AppLayout';
import { AdminPage } from '@/pages/AdminPage';
import { AlbumPage } from '@/pages/AlbumPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RsvpPage } from '@/pages/RsvpPage';
import { TravelPage } from '@/pages/TravelPage';

/** Root router for the Vite web app. */
export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AuthGuard />}>
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/rsvp/:token" element={<RsvpPage />} />

              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/album" element={<AlbumPage />} />
                <Route path="/travel" element={<TravelPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
