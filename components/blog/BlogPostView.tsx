import Link from 'next/link'
import { Calendar, Clock, ChevronRight, Home } from 'lucide-react'
import PostTOC from '@/app/blog/[slug]/PostTOC'
import GalleryEnhancer from '@/app/blog/[slug]/GalleryEnhancer'
import '@/app/blog/[slug]/blog-content.css'
import { getPostBySlug } from '@/lib/wordpress'

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
function readingTime(content: string) {
  const words = stripHtml(content).split(/\s+/).length
  return Math.max(2, Math.ceil(words / 200))
}

export default async function BlogPostView({
  slug,
  lang,
  basePath,
}: {
  slug: string
  lang: 'es' | 'en'
  basePath: string
}) {
  const t = {
    es: { noEncontrado: 'Artículo no encontrado', volver: '← Volver al blog', lectura: 'min de lectura', cta: 'Reserva tu glamping →' },
    en: { noEncontrado: 'Article not found', volver: '← Back to blog', lectura: 'min read', cta: 'Book your glamping →' },
  }[lang]

  const post = await getPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-5xl">🏕️</p>
        <h1 className="text-xl font-semibold text-stone-700">{t.noEncontrado}</h1>
        <Link href={basePath} className="text-emerald-600 hover:underline text-sm">{t.volver}</Link>
      </div>
    )
  }

  const img = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const mins = readingTime(post.content?.rendered || '')
  const date = new Date(post.date).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'
  const canonicalPath = `${basePath}/${slug}`

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: stripHtml(post.title?.rendered),
    description: stripHtml(post.excerpt?.rendered).slice(0, 160),
    image: img ? [img] : undefined,
    datePublished: post.date,
    dateModified: post.modified ?? post.date,
    inLanguage: lang === 'es' ? 'es-CO' : 'en-US',
    url: `${SITE_URL}${canonicalPath}`,
    publisher: { '@type': 'Organization', name: 'Glamperos', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${canonicalPath}` },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: { '@id': SITE_URL, 'name': 'Inicio' } },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: { '@id': `${SITE_URL}${basePath}`, 'name': 'Blog' } },
      { '@type': 'ListItem', position: 3, name: stripHtml(post.title?.rendered), item: { '@id': `${SITE_URL}${canonicalPath}`, 'name': stripHtml(post.title?.rendered) } },
    ],
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
    <div className="min-h-screen bg-white" lang={lang}>

      {/* ── Encabezado del artículo ────────────────────────────────────── */}
      <div className="w-full lg:w-[80%] mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-stone-400 flex-wrap pt-5 pb-4">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-700 transition-colors">
            <Home size={12} /> {lang === 'es' ? 'Inicio' : 'Home'}
          </Link>
          <ChevronRight size={12} />
          <Link href={basePath} className="hover:text-stone-700 transition-colors">Blog</Link>
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
              <Clock size={14} /> {mins} {t.lectura}
            </span>
          </div>
        </div>
      </div>

      {/* ── Layout: artículo + TOC sidebar ────────────────────────────── */}
      <div className="w-full lg:w-[80%] mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="lg:flex lg:gap-12">

          {/* Artículo */}
          <div className="min-w-0 flex-1">
            <article
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: post.content?.rendered || '' }}
            />

            {/* Footer del artículo */}
            <div className="mt-12 pt-8 border-t border-stone-100 flex items-center justify-between flex-wrap gap-4">
              <Link
                href={basePath}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
              >
                {t.volver}
              </Link>
              <Link
                href="/"
                className="text-sm font-medium text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#0D261B' }}
              >
                {t.cta}
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
    </>
  )
}
