import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface GlampingCard {
  id: string
  updatedAt?: string
}

async function getGlampings(): Promise<GlampingCard[]> {
  try {
    const res = await fetch(`${API_URL}/glampings/home?limit=500`, {
      next: { revalidate: 3600 }, // regenera cada hora
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const glampings = await getGlampings()

  const glampingUrls: MetadataRoute.Sitemap = glampings.map((g) => ({
    url: `${SITE_URL}/glamping/${g.id}`,
    lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
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

  return [...staticUrls, ...glampingUrls]
}
