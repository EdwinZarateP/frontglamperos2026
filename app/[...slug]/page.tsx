import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HomeClient } from '../HomeClient'
import {
  fetchGlampingsSSR,
  parseFiltrosFromSlug,
  parseFiltrosFromSearchParams,
  buildSeoMeta,
} from '@/lib/filtros'
import type { FiltrosHome } from '@/types'

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
  return { title, description }
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

  return <HomeClient serverData={serverData} initialFiltros={initialFiltros} />
}
