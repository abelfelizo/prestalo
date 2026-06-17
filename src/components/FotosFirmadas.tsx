import { View, Image, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { firmarUrls } from '@/lib/upload'
import { COLORS } from '@/lib/constants'

/** Muestra miniaturas de fotos guardadas como rutas del bucket privado (genera URLs firmadas). */
export function FotosFirmadas({ paths }: { paths: string[] }) {
  const { data } = useQuery({
    queryKey: ['fotos-firmadas', paths],
    queryFn: () => firmarUrls(paths),
    enabled: paths.length > 0,
  })
  if (!data?.length) return null
  return (
    <View style={s.row}>
      {data.map((u) => (
        <Image key={u} source={{ uri: u }} style={s.foto} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  foto: { width: 64, height: 64, borderRadius: 8, backgroundColor: COLORS.surface },
})
