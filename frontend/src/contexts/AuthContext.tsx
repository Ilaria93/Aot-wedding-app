import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  isAdmin,
  fetchCurrentUserProfile,
  loginAccount,
  updateCurrentUserProfile,
  type AuthUser,
  type LoginPayload,
  type UpdateProfilePayload,
} from '@/services/authApi';
import { logoutCurrentSession } from '@/services/authSession';
import { translate } from '@/contexts/I18nContext';
import { getAuthApiErrorMessage } from '@/services/authApiErrors';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  canManageWedding: boolean;
  isBootstrapping: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: UpdateProfilePayload) => Promise<void>;
  applySession: (user: AuthUser) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The httpOnly access-token cookie, if any, is sent automatically — a 200
// here means it was valid, a 401 means there's no session to restore.
async function loadCurrentUserOrNull() {
  try {
    return await fetchCurrentUserProfile();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrapAuth() {
      setUser(await loadCurrentUserOrNull());
      setIsBootstrapping(false);
    }

    bootstrapAuth();
  }, []);

  async function applySession(loggedInUser: AuthUser) {
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function signIn(payload: LoginPayload) {
    try {
      const loggedInUser = await loginAccount(payload);
      return await applySession(loggedInUser);
    } catch (caughtError) {
      throw new Error(
        getAuthApiErrorMessage(caughtError, translate, 'login', translate('login.genericError')),
      );
    }
  }

  async function signOut() {
    await logoutCurrentSession();
    setUser(null);
  }

  async function refreshProfile() {
    setUser(await loadCurrentUserOrNull());
  }

  async function saveProfile(payload: UpdateProfilePayload) {
    try {
      const updatedUser = await updateCurrentUserProfile(payload);
      setUser(updatedUser);
    } catch (caughtError) {
      throw new Error(
        getAuthApiErrorMessage(caughtError, translate, 'profile', translate('profile.updateError')),
      );
    }
  }

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      canManageWedding: isAdmin(user?.role),
      isBootstrapping,
      signIn,
      signOut,
      refreshProfile,
      saveProfile,
      applySession,
    }),
    [user, isBootstrapping],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
