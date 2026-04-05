import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HomeClient } from '../HomeClient'
import {
  fetchGlampingsSSR,
  parseFiltrosFromSlug,
  parseFiltrosFromSearchParams,
  buildSeoMeta,
  buildCityPageContent,
} from '@/lib/filtros'
import type { FiltrosHome } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<Record<string, string>>
}): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const slugFiltros = parseFiltrosFromSlug(slug) ?? {}
  const spFiltros   = parseFiltrosFromSearchParams(sp)
  const filtros     = { ...slugFiltros, ...spFiltros }
  const { title, description } = buildSeoMeta(filtros)
  const canonicalPath = '/' + slug.join('/')
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
  }
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams

  const slugFiltros = parseFiltrosFromSlug(slug)
  if (!slugFiltros) notFound()

  const spFiltros = parseFiltrosFromSearchParams(sp)
  const initialFiltros: Partial<FiltrosHome> = { ...slugFiltros, ...spFiltros }

  const serverData = await fetchGlampingsSSR(initialFiltros)

  // City slug is the first segment (e.g. "bogota", "villa-de-leyva")
  const citySlug = slug[0]
  const { h1, intro, hasFilters } = buildCityPageContent(initialFiltros, citySlug)

  // ItemList JSON-LD para la página de ciudad/filtro
  const itemListJsonLd = serverData?.data?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: h1,
        description: intro,
        numberOfItems: serverData.data.length,
        itemListElement: serverData.data.slice(0, 20).map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.nombreSeo,
          url: `${SITE_URL}/glamping/${g.id}`,
        })),
      }
    : null

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: h1, item: `${SITE_URL}/${slug.join('/')}` },
    ],
  }

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <HomeClient
        serverData={serverData}
        initialFiltros={initialFiltros}
        heroTitle={hasFilters ? h1 : undefined}
        heroIntro={intro}
      />
    </>
  )
}
