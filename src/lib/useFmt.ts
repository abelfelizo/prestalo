import { useSession } from '@/store/session'
import { fmt } from '@/lib/calculos'

/** Devuelve un formateador de montos con la moneda de la cartera activa. */
export function useFmt() {
  const moneda = useSession((s) => s.moneda)
  return (n: number | null | undefined) => fmt(n, moneda)
}
