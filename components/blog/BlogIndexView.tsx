import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, ChevronRight, Home } from 'lucide-react'
import { countPosts, getPosts, WORDPRESS_API } from '@/lib/wordpress'

const PER_PAGE = 10

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&#8230;/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
}

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

export const BLOG_TEXTS = {
  es: {
    heading: 'BIENVENIDO AL BLOG DE GLAMPEROS',
    intro: 'En Glamperos creemos que viajar es reconectarte con quienes amas y con la naturaleza. Por eso creamos este blog, un espacio para inspirarte con guías, recomendaciones e ideas para disfrutar de glampings, cabañas, domos y otros alojamientos únicos.',
    cta: '¡Sigue leyendo y descubre más!',
    destacado: 'Artículo destacado',
    leerMas: 'Leer más',
    saberMas: 'Saber más →',
    vacio: 'No hay artículos disponibles.',
    error: 'Error al cargar artículos.',
    noDisponible: 'Blog no disponible por el momento.',
    anterior: '← Anterior',
    siguiente: 'Siguiente →',
  },
  en: {
    heading: 'WELCOME TO THE GLAMPEROS BLOG',
    intro: 'At Glamperos we believe traveling means reconnecting with the people you love and with nature. That is why we created this blog — a space to inspire you with guides, recommendations and ideas to enjoy glamping, cabins, domes and other unique stays in Colombia.',
    cta: 'Keep reading and discover more!',
    destacado: 'Featured article',
    leerMas: 'Read more',
    saberMas: 'Learn more →',
    vacio: 'No articles available yet.',
    error: 'Error loading articles.',
    noDisponible: 'Blog temporarily unavailable.',
    anterior: '← Previous',
    siguiente: 'Next →',
  },
} as const

export default async function BlogIndexView({
  lang,
  basePath,
  page,
}: {
  lang: 'es' | 'en'
  basePath: string
  page: number
}) {
  const t = BLOG_TEXTS[lang]
  const currentPage = Math.max(1, page)

  if (!WORDPRESS_API) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-stone-400">{t.noDisponible}</p>
      </div>
    )
  }

  const totalPosts = await countPosts(lang)

  // Umbral: si hay menos de 16 posts, mostrar todos en una sola página
  const CONSOLIDATION_THRESHOLD = 16
  const shouldConsolidate = totalPosts <= CONSOLIDATION_THRESHOLD
  const postsPerPage = shouldConsolidate ? 100 : PER_PAGE // 100 es el máximo de WordPress

  const posts = await getPosts(lang, postsPerPage, currentPage)
  if (posts === null) return <p className="text-center py-24 text-stone-400">{t.error}</p>
  if (!posts.length) return <p className="text-center py-24 text-stone-400">{t.vacio}</p>

  const effectiveTotalPages = shouldConsolidate ? Math.max(1, Math.ceil(totalPosts / postsPerPage)) : Math.max(1, Math.ceil(totalPosts / PER_PAGE))

  if (currentPage > effectiveTotalPages) {
    redirect(basePath)
  }

  const showFeatured = currentPage === 1
  const [featured, ...rest] = posts
  const grid = showFeatured ? rest : posts

  const WINDOW = 2
  const start = Math.max(1, currentPage - WINDOW)
  const end = Math.min(effectiveTotalPages, currentPage + WINDOW)
  const pages = range(start, end)

  const featuredImg = featured?._embedded?.['wp:featuredmedia']?.[0]?.source_url

  return (
    <div className="min-h-screen bg-white" lang={lang}>

      {/* ── Miga de pan ────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[80%] mx-auto px-4 sm:px-6 pt-5 pb-0">
        <nav className="flex items-center gap-1 text-xs text-stone-400 flex-wrap">
          <Link href="/" className="flex items-center gap-1 hover:text-stone-700 transition-colors">
            <Home size={12} /> {lang === 'es' ? 'Inicio' : 'Home'}
          </Link>
          <ChevronRight size={12} />
          <span className="text-stone-600 font-medium">Blog</span>
        </nav>
      </div>

      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[80%] mx-auto px-4 sm:px-6 pt-6 pb-6">
        <div className="flex items-center gap-2 justify-center mb-4">
          <span className="text-2xl">🌿</span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-center" style={{ color: '#0D261B' }}>
            {t.heading}
          </h1>
        </div>

        {/* Selector de idioma del blog */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
            {lang === 'es' ? (
              <>
                <span className="px-4 py-1.5 rounded-full bg-white text-xs font-bold text-stone-900 shadow-sm">🇪🇸 Español</span>
                <Link href="/en/blog" className="px-4 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors">
                  🇺🇸 English
                </Link>
              </>
            ) : (
              <>
                <Link href="/blog" className="px-4 py-1.5 rounded-full text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors">
                  🇪🇸 Español
                </Link>
                <span className="px-4 py-1.5 rounded-full bg-white text-xs font-bold text-stone-900 shadow-sm">🇺🇸 English</span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-1">{t.intro}</p>
          <Link href="#articulos" className="text-emerald-600 text-sm font-semibold hover:underline">
            {t.cta}
          </Link>
        </div>
      </div>

      {/* ── Artículo destacado ──────────────────────────────────────────── */}
      {showFeatured && featured && (
        <div className="w-full lg:w-[80%] mx-auto px-4 sm:px-6 mb-10">
          <Link
            href={`${basePath}/${featured.slug}`}
            className="group flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-stone-100 hover:shadow-lg transition-shadow bg-white sm:h-72"
          >
            <div className="relative w-full sm:w-1/2 h-56 sm:h-full overflow-hidden bg-stone-200 shrink-0">
              {featuredImg
                ? <img
                    src={featuredImg}
                    alt={stripHtml(featured.title.rendered)}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                : <div className="w-full h-full flex items-center justify-center text-5xl bg-emerald-50">🏕️</div>
              }
            </div>

            <div className="flex flex-col justify-center p-6 sm:p-8 sm:w-1/2 overflow-hidden">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">{t.destacado}</p>
              <h2
                className="text-xl sm:text-2xl font-bold leading-snug mb-3"
                style={{ color: '#0D261B' }}
                dangerouslySetInnerHTML={{ __html: featured.title.rendered }}
              />
              <p className="text-sm text-stone-500 leading-relaxed line-clamp-4 mb-5">
                {stripHtml(featured.excerpt.rendered)}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:gap-2.5 transition-all">
                {t.leerMas} <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        </div>
      )}

      {/* ── Grid de artículos ─────────────────────────────────────────── */}
      <div id="articulos" className="w-full lg:w-[80%] mx-auto px-4 sm:px-6 pb-14">
        {grid.length > 0 && (
          <div className={[
            'grid gap-4 mb-10',
            grid.length === 1 ? 'grid-cols-1 max-w-md' :
            grid.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          ].join(' ')}>
            {grid.map((post) => {
              const img = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
              const excerpt = stripHtml(post.excerpt.rendered)
              return (
                <Link
                  key={post.id}
                  href={`${basePath}/${post.slug}`}
                  className="group flex flex-col rounded-xl overflow-hidden border border-stone-100 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="relative h-44 sm:h-40 lg:h-48 overflow-hidden bg-stone-200 shrink-0">
                    {img
                      ? <img src={img} alt={stripHtml(post.title.rendered)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl bg-emerald-50">🏕️</div>
                    }
                  </div>

                  <div className="flex flex-col flex-1 p-3">
                    <h3
                      className="text-xs sm:text-sm font-bold text-stone-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-emerald-700 transition-colors"
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                    <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2 flex-1">
                      {excerpt}
                    </p>
                    <span className="mt-2 text-[11px] font-semibold text-emerald-600">
                      {t.saberMas}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Paginación ──────────────────────────────────────────────── */}
        {effectiveTotalPages > 1 && (
          <nav className="flex items-center justify-center gap-1" aria-label="Paginación">
            {currentPage > 1
              ? <Link href={`${basePath}?page=${currentPage - 1}`} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors">{t.anterior}</Link>
              : <span className="px-4 py-2 text-sm text-stone-300">{t.anterior}</span>
            }
            <div className="flex items-center gap-1 mx-2">
              {start > 1 && (
                <>
                  <Link href={`${basePath}?page=1`} className="w-9 h-9 flex items-center justify-center text-sm text-stone-600 hover:bg-stone-100 rounded-lg">1</Link>
                  {start > 2 && <span className="text-stone-400 px-1">…</span>}
                </>
              )}
              {pages.map((p) => (
                p === currentPage
                  ? <span key={p} className="w-9 h-9 flex items-center justify-center text-sm font-semibold bg-emerald-600 text-white rounded-lg">{p}</span>
                  : <Link key={p} href={`${basePath}?page=${p}`} className="w-9 h-9 flex items-center justify-center text-sm text-stone-600 hover:bg-stone-100 rounded-lg">{p}</Link>
              ))}
              {end < effectiveTotalPages && (
                <>
                  {end < effectiveTotalPages - 1 && <span className="text-stone-400 px-1">…</span>}
                  <Link href={`${basePath}?page=${effectiveTotalPages}`} className="w-9 h-9 flex items-center justify-center text-sm text-stone-600 hover:bg-stone-100 rounded-lg">{effectiveTotalPages}</Link>
                </>
              )}
            </div>
            {currentPage < effectiveTotalPages
              ? <Link href={`${basePath}?page=${currentPage + 1}`} className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors">{t.siguiente}</Link>
              : <span className="px-4 py-2 text-sm text-stone-300">{t.siguiente}</span>
            }
          </nav>
        )}
      </div>
    </div>
  )
}
