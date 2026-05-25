import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { aotTheme } from '@/constants/aotTheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="rsvp/[token]"
            options={{
              title: 'RSVP',
              headerStyle: { backgroundColor: aotTheme.surface },
              headerTintColor: aotTheme.textPrimary,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="auth/login"
            options={{
              title: 'Accedi',
              headerStyle: { backgroundColor: aotTheme.surface },
              headerTintColor: aotTheme.textPrimary,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="auth/register"
            options={{
              title: 'Registrati',
              headerStyle: { backgroundColor: aotTheme.surface },
              headerTintColor: aotTheme.textPrimary,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
