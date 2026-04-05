import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'),
  title: {
    default: 'Glamperos — Glamping en Colombia | Domos, Cabañas y más',
    template: '%s | Glamperos',
  },
  description:
    'Descubre los mejores glampings de Colombia. Domos, cabañas, treehouses y experiencias únicas en la naturaleza. Reserva fácil y seguro.',
  keywords: [
    'glamping colombia',
    'glamping bogota',
    'domos glamping',
    'cabañas naturaleza',
    'glamping cundinamarca',
    'experiencias naturaleza colombia',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'Glamperos',
    // opengraph-image.tsx genera la imagen automáticamente
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Glamperos',
  url: 'https://glamperos.com',
  logo: 'https://glamperos.com/logos/glamperos-logo.png',
  description: 'Plataforma colombiana de glamping. Reserva domos, cabañas, treehouses y experiencias únicas en la naturaleza de Colombia.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
    contactOption: 'TollFree',
  },
  sameAs: [
    'https://www.instagram.com/glamperos',
    'https://www.facebook.com/glamperos',
    'https://www.tiktok.com/@glamperos',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Colombia',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Glamperos',
  url: 'https://glamperos.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://glamperos.com/?ciudad={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body suppressHydrationWarning className="font-sans bg-white text-stone-900 antialiased overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  )
}
