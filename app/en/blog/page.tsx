import type { Metadata } from 'next'
import BlogIndexView from '@/components/blog/BlogIndexView'

export const metadata: Metadata = {
  title: 'Blog — Glamping Guides and Tips in Colombia',
  description: 'Advice, routes and destinations for glamping in Colombia. Inspiration and practical guides for your next escape into nature.',
  alternates: {
    canonical: '/en/blog',
    languages: { 'es': '/blog', 'en': '/en/blog' },
  },
  openGraph: {
    title: 'Glamperos Blog — Glamping Guides and Tips in Colombia',
    description: 'Advice, routes and destinations for glamping in Colombia. Inspiration and practical guides for your next escape into nature.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Glamperos Blog — Glamping Guides and Tips in Colombia',
    description: 'Advice, routes and destinations for glamping in Colombia. Inspiration and practical guides for your next escape into nature.',
    images: ['https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'],
  },
}

export default async function BlogIndexEn({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const { page } = (await searchParams) ?? {}
  return <BlogIndexView lang="en" basePath="/en/blog" page={Number(page ?? '1')} />
}
