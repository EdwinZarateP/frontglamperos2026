import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_API

interface GlampingCard {
  id: string
  updatedAt?: string
}

interface WpPost {
  slug: string
  date: string
  modified: string
}

async function getGlampings(): Promise<GlampingCard[]> {
  try {
    const res = await fetch(`${API_URL}/glampings/home?limit=500`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

async function getBlogPosts(): Promise<WpPost[]> {
  if (!WP_API) return []
  try {
    const res = await fetch(
      `${WP_API}/posts?per_page=100&fields=slug,date,modified&status=publish`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [glampings, blogPosts] = await Promise.all([getGlampings(), getBlogPosts()])

  const glampingUrls: MetadataRoute.Sitemap = glampings.map((g) => ({
    url: `${SITE_URL}/glamping/${g.id}`,
    lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const blogPostUrls: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.modified ? new Date(p.modified) : new Date(p.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  // Páginas de ciudad/zona — alta prioridad para SEO orgánico
  const ZONE_SLUGS = [
    // Bogotá / Cundinamarca
    'bogota', 'guatavita', 'la-calera', 'tabio', 'suesca', 'villeta',
    'fusagasuga', 'girardot', 'la-mesa', 'anapoima',
    // Medellín / Antioquia
    'medellin', 'guatape', 'el-retiro', 'jardin', 'santa-fe-de-antioquia',
    'girardota', 'caldas-antioquia', 'san-jeronimo', 'la-estrella',
    // Boyacá
    'paipa', 'villa-de-leyva', 'raquira', 'nobsa', 'mongui', 'tinjaca',
    // Santander
    'barichara', 'san-gil', 'lebrija', 'velez',
    // Eje Cafetero
    'salento', 'filandia', 'santa-rosa-de-cabal', 'armenia',
    // Costa
    'cartagena', 'santa-marta',
    // Meta / Llanos
    'villavicencio', 'restrepo-meta',
  ]

  const zoneUrls: MetadataRoute.Sitemap = ZONE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Combinaciones tipo + ciudad más buscadas
  const COMBO_SLUGS = [
    'bogota/domo', 'bogota/cabana', 'bogota/jacuzzi',
    'medellin/domo', 'medellin/jacuzzi',
    'boyaca/domo', 'villa-de-leyva/domo',
    'santander/domo', 'barichara/cabana',
    'salento/domo',
  ]

  const comboUrls: MetadataRoute.Sitemap = COMBO_SLUGS.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/acerca-de-nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/auth/registro`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  return [...staticUrls, ...zoneUrls, ...comboUrls, ...glampingUrls, ...blogPostUrls]
}
