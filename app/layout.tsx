import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

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
    images: ['/og-image.jpg'],
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans bg-stone-50 text-stone-900 antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
