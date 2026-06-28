import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { secureStorage } from '@/lib/secureCache'

/** Persiste la caché de TanStack Query CIFRADA en disco para lectura offline. */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: secureStorage,
  key: 'prestalo-query-cache',
})
