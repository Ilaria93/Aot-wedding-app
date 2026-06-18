import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  isAdmin,
  fetchCurrentUserProfile,
  loginAccount,
  registerAccount,
  updateCurrentUserProfile,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type UpdateProfilePayload,
} from '@/services/authApi';
import {
  clearCurrentSession,
  getAccessToken,
  logoutCurrentSession,
  restoreRememberedSession,
  setCurrentSession,
  subscribeToSessionChanges,
} from '@/services/authSession';
import { translate } from '@/contexts/I18nContext';
import { getApiErrorMessage } from '@/services/apiErrors';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  canManageWedding: boolean;
  isBootstrapping: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signUp: (payload: RegisterPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (payload: UpdateProfilePayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadCurrentUserOrClearSession() {
  try {
    return await fetchCurrentUserProfile();
  } catch {
    await clearCurrentSession();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSessionChanges((session) => {
      if (!session) {
        setUser(null);
      }
    });

    async function bootstrapAuth() {
      await restoreRememberedSession();
      const restoredUser = getAccessToken()
        ? await loadCurrentUserOrClearSession()
        : null;
      setUser(restoredUser);
      setIsBootstrapping(false);
    }

    bootstrapAuth();

    return unsubscribe;
  }, []);

  async function signIn(payload: LoginPayload) {
    try {
      const sessionResponse = await loginAccount(payload);
      await setCurrentSession({
        accessToken: sessionResponse.access_token,
        refreshToken: sessionResponse.refresh_token,
        rememberMe: sessionResponse.remember_me,
      });
      setUser(sessionResponse.user);
      return sessionResponse.user;
    } catch (caughtError) {
      throw new Error(getApiErrorMessage(caughtError, translate('login.genericError')));
    }
  }

  async function signUp(payload: RegisterPayload) {
    try {
      const sessionResponse = await registerAccount(payload);
      await setCurrentSession({
        accessToken: sessionResponse.access_token,
        refreshToken: sessionResponse.refresh_token,
        rememberMe: sessionResponse.remember_me,
      });
      setUser(sessionResponse.user);
      return sessionResponse.user;
    } catch (caughtError) {
      throw new Error(getApiErrorMessage(caughtError, translate('register.genericError')));
    }
  }

  async function signOut() {
    await logoutCurrentSession();
    setUser(null);
  }

  async function refreshProfile() {
    const refreshedUser = await loadCurrentUserOrClearSession();
    setUser(refreshedUser);
  }

  async function saveProfile(payload: UpdateProfilePayload) {
    try {
      const updatedUser = await updateCurrentUserProfile(payload);
      setUser(updatedUser);
    } catch (caughtError) {
      throw new Error(getApiErrorMessage(caughtError, translate('profile.updateError')));
    }
  }

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      canManageWedding: isAdmin(user?.role),
      isBootstrapping,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      saveProfile,
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
