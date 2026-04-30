// src/app/layout.tsx
import type { Metadata } from "next";
import { Open_Sans, Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientProviders from "../Componentes/ClientProviders/index";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: "400",
  display: "optional",
});

// Configura Be Vietnam Pro
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://glamperos.com"),
  title: "Glamperos | Encuentra y reserva los mejores glampings en Colombia",
  description:
    "Descubre y reserva glampings exclusivos en los mejores destinos naturales de Colombia. Vive una experiencia única en alojamientos de lujo en medio de la naturaleza.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Glamperos | Encuentra y reserva los mejores glampings en Colombia",
    description:
      "Explora glampings exclusivos en Colombia y vive una experiencia de lujo en la naturaleza. Reserva fácil y rápido.",
    url: "https://glamperos.com",
    siteName: "Glamperos",
    images: [
      {
        url: "https://storage.googleapis.com/glamperos-imagenes/Imagenes/animal5.jpeg",
        width: 1200,
        height: 630,
        alt: "Glamperos - Glamping de lujo en Colombia",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@glamperos",
    title: "Glamperos | Encuentra y reserva los mejores glampings en Colombia",
    description:
      "Descubre glampings exclusivos en Colombia y vive una experiencia de lujo en la naturaleza.",
    images: [
      "https://storage.googleapis.com/glamperos-imagenes/Imagenes/animal5.jpeg",
    ],
  },
  // alternates: { canonical: "https://glamperos.com" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${openSans.className} ${beVietnam.variable}`}>

      <head>
        {/* Favicon y Apple Touch Icon apuntando a tu logo en Google Cloud */}
        <link
          rel="icon"
          href="https://storage.googleapis.com/glamperos-imagenes/Imagenes/animal5.jpeg"
          type="image/jpeg"
        />
        <link
          rel="apple-touch-icon"
          href="https://storage.googleapis.com/glamperos-imagenes/Imagenes/animal5.jpeg"
        />

        <meta
          name="google-site-verification"
          content="TU-CODIGO-DE-VERIFICACION"
        />

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

        {/* JSON‑LD Schema para Google Search */}
        <Script type="application/ld+json" strategy="afterInteractive">
          {`
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Glamperos",
            "url": "https://glamperos.com",
            "description": "Plataforma para descubrir y reservar glampings exclusivos en Colombia.",
            "logo": "https://storage.googleapis.com/glamperos-imagenes/Imagenes/animal5.jpeg",
            "sameAs": [
              "https://www.instagram.com/glamperos",
              "https://www.facebook.com/glamperos"
            ]
          }
          `}
        </Script>

        {/* Wompi Checkout Widget */}
        {/* <Script
          src="https://checkout.wompi.co/widget.js"
          strategy="beforeInteractive"
        /> */}
      </head>

      <body className={openSans.className}>


        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N62D2LDT"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>

        <ClientProviders>{children}</ClientProviders>

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
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1256680626246372&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
    </html>
  );
}
