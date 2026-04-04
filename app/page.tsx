import type { Metadata } from 'next'
import { HomeClient } from './HomeClient'
import { fetchGlampingsSSR, parseFiltrosFromSearchParams } from '@/lib/filtros'
import type { FiltrosHome } from '@/types'

export const metadata: Metadata = {
  title: 'Glamperos — Glamping en Colombia | Domos, Cabañas, Treehouses',
  description:
    'Encuentra y reserva los mejores glampings de Colombia. Domos, cabañas en la montaña, casas en árbol y experiencias únicas. Precios transparentes, reserva segura.',
  alternates: { canonical: '/' },
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Glamperos',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description:
    'Plataforma de reservas de glamping en Colombia. Domos, cabañas, treehouses y experiencias únicas en la naturaleza.',
  sameAs: [],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: 'Spanish',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Glamperos',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/?ciudad={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

async function fetchTierramontMujer() {
  try {
    const res = await fetch(
      'https://tierramont.com/collections/mujer/products.json?limit=10',
      { next: { revalidate: 1800 } } // ISR 30 min
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.products ?? []
  } catch {
    return []
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const initialFiltros: Partial<FiltrosHome> = parseFiltrosFromSearchParams(sp)

  const [serverData, tierramontProducts] = await Promise.all([
    fetchGlampingsSSR(initialFiltros),
    fetchTierramontMujer(),
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomeClient
        serverData={serverData}
        initialFiltros={initialFiltros}
        tierramontProducts={tierramontProducts}
      />
    </>
  )
}
