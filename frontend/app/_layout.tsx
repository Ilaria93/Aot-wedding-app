import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider, useI18n } from '@/contexts/I18nContext';
import { aotTheme } from '@/constants/aotTheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Keeps tabs as the default route when the app boots.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider
          value={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: aotTheme.background,
              card: aotTheme.surface,
              text: aotTheme.textPrimary,
              border: aotTheme.border,
              primary: aotTheme.bronze,
            },
          }}>
          <AuthNavigation />
        </ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  );
}

function AuthNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isBootstrapping } = useAuth();
  const { t } = useI18n();

  const isAuthRoute = segments[0] === 'auth';
  const shouldRedirectToLogin = !isBootstrapping && !isAuthenticated && !isAuthRoute;
  const shouldRedirectToApp = !isBootstrapping && isAuthenticated && isAuthRoute;

  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace('/auth/login');
      return;
    }

    if (shouldRedirectToApp) {
      router.replace('/');
    }
  }, [router, shouldRedirectToApp, shouldRedirectToLogin]);

  if (isBootstrapping || shouldRedirectToLogin || shouldRedirectToApp) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: aotTheme.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={aotTheme.bronze} size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: aotTheme.surface },
        headerTintColor: aotTheme.textPrimary,
        headerShadowVisible: false,
        headerRight: () => <LanguageSwitcher compact />,
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="rsvp/[token]"
        options={{
          title: t('navigation.stack.rsvp'),
        }}
      />
      <Stack.Screen
        name="auth/login"
        options={{
          title: t('navigation.stack.login'),
        }}
      />
      <Stack.Screen
        name="auth/register"
        options={{
          title: t('navigation.stack.register'),
        }}
      />
    </Stack>
  );
}
