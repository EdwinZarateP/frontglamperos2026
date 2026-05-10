import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HomeClient } from '../HomeClient'
import { CategoriasCarouselServer } from '@/components/home/CategoriasCarouselServer'
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

  // Imagen OG específica para ciudades
  const citySlug = slug[0]
  const cityOgImages: Record<string, string> = {
    cali: 'https://storage.googleapis.com/glamperos-imagenes/glampings/alas-glamping_20260509_201121_e646e67e.webp',
    bogota: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/cundinamarca.jpg',
    medellin: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/antioquiacard.jpg',
  }
  const ogImage = cityOgImages[citySlug] || `${SITE_URL}/og-default.jpg`

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: 'Glamperos',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
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
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: {
          '@id': SITE_URL,
          'name': 'Inicio',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: h1,
        item: {
          '@id': `${SITE_URL}/${slug.join('/')}`,
          'name': h1,
        },
      },
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
        carouselSection={<CategoriasCarouselServer />}
      />
    </>
  )
}
