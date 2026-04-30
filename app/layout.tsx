import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
    icon: [
      { url: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/logoMiniatura.jpeg', sizes: '48x48' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
      <head>

        {/* Google Tag Manager (head) */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-N62D2LDT');
          `}
        </Script>

        {/* Google Maps Places */}
        <Script
          src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDP8Es7GVLkm_qdCItKb60pGH7ov_tEif0&libraries=places"
          strategy="beforeInteractive"
        />

        {/* Favicon - Google Cloud Storage */}
        <link
          rel="icon"
          href="https://storage.googleapis.com/glamperos-imagenes/Imagenes/logoMiniatura.jpeg"
          type="image/x-icon"
        />

      </head>
      <body suppressHydrationWarning className="font-sans bg-white text-stone-900 antialiased overflow-x-hidden">

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N62D2LDT"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* JSON-LD Schemas */}
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

        {/* Google Analytics & Ads (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-NXB4CM5T4H"
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17234612701"
        />
        <Script id="google-tags" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NXB4CM5T4H');
            gtag('config', 'AW-17234612701');
          `}
        </Script>

        {/* Facebook Pixel */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1256680626246372');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src="https://www.facebook.com/tr?id=1256680626246372&ev=PageView&noscript=1"
          />
        </noscript>

      </body>
    </html>
  )
}
