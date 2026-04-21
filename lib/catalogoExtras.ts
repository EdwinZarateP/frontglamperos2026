import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface CatalogoExtra {
  key: string
  nombre: string
  unidad: 'por_persona' | 'por_pareja'
}

export const UNIDAD_LABELS: Record<string, string> = {
  por_persona: 'por persona',
  por_pareja:  'por pareja',
}

export function useCatalogoExtras() {
  return useQuery<CatalogoExtra[]>({
    queryKey: ['catalogo-extras'],
    queryFn: async () => {
      const { data } = await api.get('/catalogos/extras')
      return data.extras as CatalogoExtra[]
    },
    staleTime: 1000 * 60 * 10,
  })
}
