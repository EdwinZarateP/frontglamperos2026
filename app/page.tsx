import type { Metadata } from 'next'
import { HomeClient } from './HomeClient'
import { fetchGlampingsSSR } from '@/lib/filtros'

export const metadata: Metadata = {
  title: 'Glamperos — Glamping en Colombia | Domos, Cabañas, Treehouses',
  description:
    'Encuentra y reserva los mejores glampings de Colombia. Domos, cabañas en la montaña, casas en árbol y experiencias únicas. Precios transparentes, reserva segura.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const serverData = await fetchGlampingsSSR({})
  return <HomeClient serverData={serverData} />
}
