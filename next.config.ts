import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/glamperos-imagenes/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Redirects: URLs antiguas → URLs nuevas (limpias)
  async redirects() {
    return [
      // Ciudades con sufijo de departamento → sin sufijo
      { source: '/girardota-antioquia', destination: '/girardota', permanent: true },
      { source: '/guatape-antioquia', destination: '/guatape', permanent: true },
      { source: '/guatavita-cundinamarca', destination: '/guatavita', permanent: true },
      { source: '/paipa-boyaca', destination: '/paipa', permanent: true },

      // Tipos de glamping que ya no se usan → solo departamento
      { source: '/boyaca/malla-catamaran', destination: '/boyaca', permanent: true },
      { source: '/boyaca/tienda', destination: '/boyaca', permanent: true },

      // Ciudad + amenidad → URL limpia
      { source: '/guatape-antioquia/jacuzzi', destination: '/guatape/jacuzzi', permanent: true },

      // Propiedad específica → ciudad + amenidad
      { source: '/propiedad/68113e580389b5eca382d8fc', destination: '/medellin/piscina', permanent: true },
    ]
  },

  // Rewrites: /propiedad/:id sirve el mismo contenido que /glamping/:id
  // sin cambiar la URL del navegador → UTM params y gclid se preservan para Google Ads
  async rewrites() {
    return [
      { source: '/propiedad/:id/fotos',   destination: '/glamping/:id/fotos' },
      { source: '/propiedad/:id/reservar', destination: '/glamping/:id/reservar' },
      { source: '/propiedad/:id',         destination: '/glamping/:id' },
    ]
  },

  // Headers de seguridad y performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/glamping/:id',
        headers: [{ key: 'Cache-Control', value: 's-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/propiedad/:id',
        headers: [{ key: 'Cache-Control', value: 's-maxage=300, stale-while-revalidate=600' }],
      },
    ]
  },
}

export default nextConfig
