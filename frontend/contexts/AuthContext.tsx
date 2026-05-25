import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';

import {
  AuthUser,
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
  logoutCurrentSession,
  restoreRememberedSession,
  setCurrentSession,
  subscribeToSessionChanges,
} from '@/services/authSession';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBootstrapping: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
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
      const restoredUser = await loadCurrentUserOrClearSession();
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
    } catch (caughtError) {
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      throw new Error(requestError.response?.data?.detail || 'Accesso non riuscito.');
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
    } catch (caughtError) {
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      throw new Error(requestError.response?.data?.detail || 'Registrazione non riuscita.');
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
      const requestError = caughtError as AxiosError<{ detail?: string }>;
      throw new Error(requestError.response?.data?.detail || 'Aggiornamento profilo non riuscito.');
    }
  }

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
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
