import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from '@/lib/queryClient'
import { asyncStoragePersister } from '@/lib/persister'

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </PersistQueryClientProvider>
  )
}
