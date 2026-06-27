import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { StyleSheet, Platform } from 'react-native'
import { color, font, radius, shadowCard } from '@/theme'

type IconName = keyof typeof Feather.glyphMap

function tabIcon(name: IconName) {
  return ({ color: c, size }: { color: string; size: number }) => <Feather name={name} size={size - 2} color={c} />
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.faint,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Platform.OS === 'ios' ? 28 : 14,
          height: 64,
          borderRadius: radius.xxl,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          paddingTop: 8,
          paddingBottom: 8,
          ...shadowCard,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="light"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: radius.xxl, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' }]}
          />
        ),
        tabBarLabelStyle: { fontFamily: font.bodyBold, fontSize: 9 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ tabBarLabel: 'Inicio', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="clientes" options={{ tabBarLabel: 'Clientes', tabBarIcon: tabIcon('users') }} />
      <Tabs.Screen name="prestamos" options={{ tabBarLabel: 'Préstamos', tabBarIcon: tabIcon('credit-card') }} />
      <Tabs.Screen name="caja" options={{ tabBarLabel: 'Caja', tabBarIcon: tabIcon('dollar-sign') }} />
      <Tabs.Screen name="ajustes" options={{ tabBarLabel: 'Ajustes', tabBarIcon: tabIcon('settings') }} />
    </Tabs>
  )
}
