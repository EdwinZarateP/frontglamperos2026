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
