/**
 * WordPress REST API helpers (server-only).
 *
 * Gestiona el bilingualismo del blog:
 * - Posts en español → /blog (excluye la categoría "english")
 * - Posts en inglés  → /en/blog (solo categoría "english", slugs terminados en -en)
 *
 * WP acepta IDs de categoría (no slugs) en los params categories/categories_exclude,
 * por eso primero resolvemos el ID de "english" y lo cacheamos 24h.
 */

const WP = process.env.NEXT_PUBLIC_WORDPRESS_API

export interface WpPost {
  id: number
  slug: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content?: { rendered: string }
  date: string
  modified?: string
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>
    'wp:term'?: Array<Array<{ name: string; slug: string }>>
  }
}

export const WORDPRESS_API = WP

/** Resuelve el ID de la categoría "english". null si WP no está configurado o no existe. */
export async function getEnglishCategoryId(): Promise<number | null> {
  if (!WP) return null
  try {
    const res = await fetch(`${WP}/categories?slug=english`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const cats = await res.json()
    return cats?.[0]?.id ?? null
  } catch {
    return null
  }
}

/**
 * Trae posts publicados del idioma indicado.
 * es → excluye la categoría english; en → solo la categoría english.
 */
export async function getPosts(lang: 'es' | 'en', perPage = 10, page = 1): Promise<WpPost[] | null> {
  if (!WP) return null
  const enId = await getEnglishCategoryId()

  const params = new URLSearchParams({
    _embed: '',
    status: 'publish',
    orderby: 'date',
    order: 'desc',
    per_page: String(perPage),
    page: String(page),
  })

  if (lang === 'en') {
    if (!enId) return [] // aún no hay categoría → aún no hay posts EN
    params.set('categories', String(enId))
  } else if (enId) {
    params.set('categories_exclude', String(enId))
  }

  try {
    const res = await fetch(`${WP}/posts?${params.toString()}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const posts: WpPost[] = await res.json()
    // Cinturón y suspicaces para el listado EN
    return lang === 'en' ? posts.filter((p) => p.slug.endsWith('-en')) : posts
  } catch {
    return null
  }
}

/** Cuenta el total de posts del idioma (usa el header X-WP-Total). */
export async function countPosts(lang: 'es' | 'en'): Promise<number> {
  if (!WP) return 0
  const enId = await getEnglishCategoryId()
  const params = new URLSearchParams({ per_page: '1', status: 'publish' })
  if (lang === 'en') {
    if (!enId) return 0
    params.set('categories', String(enId))
  } else if (enId) {
    params.set('categories_exclude', String(enId))
  }
  try {
    const res = await fetch(`${WP}/posts?${params.toString()}`, { next: { revalidate: 3600 } })
    return Number(res.headers.get('X-WP-Total') || '0')
  } catch {
    return 0
  }
}

/** Trae un post por slug (cualquier idioma). */
export async function getPostBySlug(slug: string): Promise<WpPost | null> {
  if (!WP) return null
  try {
    const res = await fetch(`${WP}/posts?slug=${slug}&_embed`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const posts: WpPost[] = await res.json()
    return posts?.[0] ?? null
  } catch {
    return null
  }
}
