import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24, // 24h: conserva datos para uso offline
    },
  },
})
