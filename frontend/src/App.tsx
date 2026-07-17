import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthGuard } from '@/components/AuthGuard/index';
import { AuthProvider } from '@/contexts/AuthContext';
import { HeroScrollProvider } from '@/contexts/HeroScrollContext';
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
import { TravelPage } from '@/pages/TravelPage/index';

// Dev-only 3D preview route: lazy + gated on import.meta.env.DEV so the heavy
// titan preview/scene code never ends up in the production bundle.
const TitanPreviewPage = lazy(() =>
  import('@/pages/TitanPreviewPage/index').then((module) => ({ default: module.TitanPreviewPage })),
);

/** Root router for the Vite web app. */
export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <HeroScrollProvider>
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

              {import.meta.env.DEV && (
                <Route
                  path="/dev/titan-preview"
                  element={
                    <Suspense fallback={null}>
                      <TitanPreviewPage />
                    </Suspense>
                  }
                />
              )}

              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </HeroScrollProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
