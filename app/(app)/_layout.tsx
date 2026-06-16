import { Tabs } from 'expo-router'
import { COLORS } from '@/lib/constants'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#bbb',
        tabBarStyle: {
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ tabBarLabel: 'Inicio' }} />
      <Tabs.Screen name="clientes" options={{ tabBarLabel: 'Clientes' }} />
      <Tabs.Screen name="prestamos" options={{ tabBarLabel: 'Préstamos' }} />
      <Tabs.Screen name="caja" options={{ tabBarLabel: 'Caja' }} />
      <Tabs.Screen name="ajustes" options={{ tabBarLabel: 'Ajustes' }} />
    </Tabs>
  )
}
