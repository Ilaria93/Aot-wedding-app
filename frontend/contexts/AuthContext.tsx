import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  AuthUser,
  canManageWedding,
  fetchCurrentUserProfile,
  loginAccount,
  LoginPayload,
  registerAccount,
  RegisterPayload,
  updateCurrentUserProfile,
  UpdateProfilePayload,
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
import { DEV_MOCK_AUTH_USER, DEV_UNLOCK_ALL_ROUTES } from '@/constants/devAccess';
import { getApiErrorMessage } from '@/utils/apiErrors';

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
      if (DEV_UNLOCK_ALL_ROUTES) {
        setUser(DEV_MOCK_AUTH_USER);
        setIsBootstrapping(false);
        return;
      }

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
      canManageWedding: canManageWedding(user?.role),
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
