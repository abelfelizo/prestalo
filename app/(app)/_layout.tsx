import { Tabs } from 'expo-router'
import { Feather } from '@expo/vector-icons'
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
          borderTopColor: COLORS.border,
          height: 66,
          paddingBottom: 10,
          paddingTop: 8,
        },
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
