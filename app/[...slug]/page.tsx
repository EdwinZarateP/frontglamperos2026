import type { Metadata } from 'next'
import { HomeClient } from '../HomeClient'
import { buildFiltrosFromSlug, buildSeoMeta, fetchGlampingsSSR } from '@/lib/filtros'

interface Props {
  params: Promise<{ slug: string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { title, description } = buildSeoMeta(slug)
  const canonical = '/' + slug.join('/')
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description },
  }
}

export default async function FilteredHomePage({ params }: Props) {
  const { slug } = await params
  const initialFiltros = buildFiltrosFromSlug(slug)
  const serverData = await fetchGlampingsSSR(initialFiltros)
  return <HomeClient initialFiltros={initialFiltros} serverData={serverData} />
}
