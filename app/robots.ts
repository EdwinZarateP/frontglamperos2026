import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/anfitrion/',
          '/perfil/',
          '/favoritos/',
          '/mis-reservas/',
          '/pago/',
          '/calificaciones/',
          '/auth/callback',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
