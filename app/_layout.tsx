import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from '@/lib/queryClient'
import { asyncStoragePersister } from '@/lib/persister'
import { flush, iniciarAutoSync } from '@/lib/outbox'
import { PinPromptModal } from '@/components/PinPromptModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout() {
  useEffect(() => {
    flush().then((n) => {
      if (n > 0) queryClient.invalidateQueries()
    })
    const unsub = iniciarAutoSync(() => queryClient.invalidateQueries())
    return () => unsub()
  }, [])

  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
        <PinPromptModal />
      </PersistQueryClientProvider>
    </ErrorBoundary>
  )
}
