import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { tienePIN, getCarteraActiva } from '../lib/storage'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const tiene = await tienePIN()
      if (!tiene) {
        router.replace('/(auth)/welcome')
        return
      }
      const cartera = await getCarteraActiva()
      if (!cartera) {
        router.replace('/(auth)/setup')
        return
      }
      router.replace('/(auth)/pin')
    }
    check()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
      <ActivityIndicator color="#C9A84C" size="large" />
    </View>
  )
}
