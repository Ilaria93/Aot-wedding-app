import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/components/AuthGuard/index';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { AppLayout } from '@/layouts/AppLayout/index';
import { AuthStackLayout } from '@/layouts/AuthStackLayout/index';
import { AdminPage } from '@/pages/AdminPage/index';
import { AlbumPage } from '@/pages/AlbumPage/index';
import { HomePage } from '@/pages/HomePage/index';
import { LoginPage } from '@/pages/LoginPage/index';
import { NotFoundPage } from '@/pages/NotFoundPage/index';
import { ProfilePage } from '@/pages/ProfilePage/index';
import { RegisterPage } from '@/pages/RegisterPage/index';
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
                <Route path="/auth/register" element={<RegisterPage />} />
              </Route>

              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/album" element={<AlbumPage />} />
                <Route path="/rsvp" element={<RsvpPage />} />
                <Route path="/travel" element={<TravelPage />} />
                <Route path="/tema" element={<TemaPage />} />
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
