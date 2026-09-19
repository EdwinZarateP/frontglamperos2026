import type { Metadata } from 'next'
import BlogIndexView from '@/components/blog/BlogIndexView'

export const metadata: Metadata = {
  title: 'Blog — Guías y tips de glamping en Colombia',
  description: 'Consejos, rutas y destinos para hacer glamping en Colombia. Inspiración y guías prácticas para tu próxima escapada en la naturaleza.',
  alternates: {
    canonical: '/blog',
    languages: { 'es': '/blog', 'en': '/en/blog' },
  },
  openGraph: {
    title: 'Blog de Glamperos — Guías y tips de glamping en Colombia',
    description: 'Consejos, rutas y destinos para hacer glamping en Colombia. Inspiración y guías prácticas para tu próxima escapada en la naturaleza.',
    type: 'website',
    locale: 'es_CO',
    images: [{ url: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog de Glamperos — Guías y tips de glamping en Colombia',
    description: 'Consejos, rutas y destinos para hacer glamping en Colombia. Inspiración y guías prácticas para tu próxima escapada en la naturaleza.',
    images: ['https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'],
  },
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const { page } = (await searchParams) ?? {}
  return <BlogIndexView lang="es" basePath="/blog" page={Number(page ?? '1')} />
}
