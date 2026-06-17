import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { StyleSheet, Platform } from 'react-native'
import { COLORS } from '@/lib/constants'

type IconName = keyof typeof Feather.glyphMap

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => <Feather name={name} size={size - 2} color={color} />
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'transparent',
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="light"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.72)', borderTopWidth: 0.5, borderTopColor: 'rgba(148,163,184,0.25)' }]}
          />
        ),
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ tabBarLabel: 'Inicio', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="clientes" options={{ tabBarLabel: 'Clientes', tabBarIcon: tabIcon('users') }} />
      <Tabs.Screen name="prestamos" options={{ tabBarLabel: 'Préstamos', tabBarIcon: tabIcon('dollar-sign') }} />
      <Tabs.Screen name="caja" options={{ tabBarLabel: 'Caja', tabBarIcon: tabIcon('credit-card') }} />
      <Tabs.Screen name="ajustes" options={{ tabBarLabel: 'Ajustes', tabBarIcon: tabIcon('settings') }} />
    </Tabs>
  )
}
