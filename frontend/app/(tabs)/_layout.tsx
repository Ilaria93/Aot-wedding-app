import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Tabs } from 'expo-router';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { aotTheme } from '@/constants/aotTheme';
import { DEV_UNLOCK_ALL_ROUTES } from '@/constants/devAccess';
import { useAuth } from '@/contexts/AuthContext';
import { HeroScrollProvider, useHeroScroll } from '@/contexts/HeroScrollContext';
import { useI18n } from '@/contexts/I18nContext';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <HeroScrollProvider>
      <TabLayoutContent />
    </HeroScrollProvider>
  );
}

function TabLayoutContent() {
  const { canManageWedding, isBootstrapping } = useAuth();
  const { t } = useI18n();
  const { isHeroScrollActive } = useHeroScroll();
  const hideTabBar = Platform.OS === 'web' && isHeroScrollActive;

  if (isBootstrapping) {
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: aotTheme.bronze,
        tabBarInactiveTintColor: aotTheme.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(249, 248, 243, 0.92)',
          borderTopColor: 'transparent',
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          height: 72,
          borderRadius: 22,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 10,
          ...(hideTabBar
            ? {
                display: 'none',
                opacity: 0,
                pointerEvents: 'none',
              }
            : Platform.OS === 'web'
              ? { boxShadow: '0 8px 18px rgba(36, 48, 36, 0.08)' }
              : {
                  shadowColor: '#243024',
                  shadowOpacity: 0.08,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 6,
                }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: aotTheme.militaryGreenDark,
          borderBottomWidth: 2,
          borderBottomColor: aotTheme.bronze,
        },
        headerTintColor: aotTheme.surface,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 16,
          letterSpacing: 1.1,
        },
        headerRight: () => <LanguageSwitcher compact tone="dark" />,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.tabs.invitation'),
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerShown: Platform.OS !== 'web',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: canManageWedding || DEV_UNLOCK_ALL_ROUTES ? undefined : null,
          title: t('navigation.tabs.admin'),
          tabBarIcon: ({ color }) => <TabBarIcon name="shield" color={color} />,
        }}
      />
      <Tabs.Screen
        name="album"
        options={{
          title: t('navigation.tabs.album'),
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
        }}
      />
      <Tabs.Screen
        name="travel"
        options={{
          title: t('navigation.tabs.travel'),
          tabBarIcon: ({ color }) => <TabBarIcon name="map-signs" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.tabs.profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
