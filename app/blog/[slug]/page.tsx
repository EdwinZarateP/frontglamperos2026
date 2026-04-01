import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, ChevronRight, Home } from 'lucide-react'
import PostTOC from './PostTOC'
import GalleryEnhancer from './GalleryEnhancer'
import './blog-content.css'

function decodeEntities(str: string) {
  return str
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&hellip;/g, '…').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#8216;/g, "'").replace(/&#8217;/g, "'")
}
function stripHtml(html?: string) {
  return decodeEntities((html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
}
function clamp(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}
function readingTime(content: string) {
  const words = stripHtml(content).split(/\s+/).length
  return Math.max(2, Math.ceil(words / 200))
}

const WP = process.env.NEXT_PUBLIC_WORDPRESS_API

async function getPost(slug: string) {
  if (!WP) return null
  const res = await fetch(`${WP}/posts?slug=${slug}&_embed`, { next: { revalidate: 300 } })
  if (!res.ok) return null
  const posts = await res.json()
  return posts?.[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Glamperos Blog' }

  const title  = stripHtml(post.title?.rendered)
  const desc   = clamp(stripHtml(post.excerpt?.rendered), 160)
  const image  = post._embedded?.['wp:featuredmedia']?.[0]?.source_url

  return {
    title,
    description: desc,
    alternates: { canonical: `/blog/${slug}` },
    robots: { index: true, follow: true },
    openGraph: { title, description: desc, type: 'article', images: image ? [{ url: image }] : undefined },
    twitter: { card: 'summary_large_image', title, description: desc, images: image ? [image] : undefined },
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-5xl">🏕️</p>
        <h1 className="text-xl font-semibold text-stone-700">Artículo no encontrado</h1>
        <Link href="/blog" className="text-emerald-600 hover:underline text-sm">← Volver al blog</Link>
      </div>
    )
  }

  const img   = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const imgAlt = post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || stripHtml(post.title.rendered)
  const mins  = readingTime(post.content?.rendered || '')
  const date  = new Date(post.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-white">

      {/* ── Encabezado del artículo ────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-stone-400 flex-wrap pt-5 pb-4">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-700 transition-colors">
            <Home size={12} /> Inicio
          </Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-stone-700 transition-colors">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-stone-600 font-medium truncate max-w-[260px]">{slug}</span>
        </nav>

        {/* Título + meta */}
        <div className="max-w-3xl">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4"
            style={{ color: '#0D261B' }}
            dangerouslySetInnerHTML={{ __html: post.title.rendered }}
          />
          <div className="flex items-center gap-5 text-sm text-stone-400 pb-6 border-b border-stone-100">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {mins} min de lectura
            </span>
          </div>
        </div>
      </div>

      {/* ── Layout: artículo + TOC sidebar ────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="lg:flex lg:gap-12">

          {/* Artículo */}
          <div className="min-w-0 flex-1">
            <article
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />

            {/* Footer del artículo */}
            <div className="mt-12 pt-8 border-t border-stone-100 flex items-center justify-between flex-wrap gap-4">
              <Link
                href="/blog"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
              >
                ← Volver al blog
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0D261B' }}
              >
                Reserva tu glamping →
              </Link>
            </div>
          </div>

          {/* TOC — sidebar en desktop, flotante en mobile */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <PostTOC />
          </aside>
        </div>
      </div>

      {/* TOC flotante solo mobile */}
      <div className="lg:hidden">
        <PostTOC mobileOnly />
      </div>

      <GalleryEnhancer />
    </div>
  )
}
