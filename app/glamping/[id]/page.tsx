import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Glamping } from '@/types'
import { calcularComision } from '@/lib/utils'
import { GlampingDetailClient } from './GlampingDetailClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://glamperos.com'

async function getGlamping(id: string): Promise<Glamping | null> {
  try {
    const res = await fetch(`${API_URL}/glampings/${id}`, {
      next: { revalidate: 3600 }, // ISR: 1h de fallback, invalida on-demand via revalidateGlamping()
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const glamping = await getGlamping(id)

  if (!glamping) return { title: 'Glamping no encontrado' }

  const firstImage = glamping.imagenes?.[0]

  // Nombre visible para el usuario: pestaña del navegador, WhatsApp, redes sociales
  const displayName = glamping.nombreGlamping

  // Extraer municipio y departamento para compartir en WhatsApp
  const [municipio, departamento] = glamping.ciudadDepartamento.split(',').map(s => s.trim())
  const shareTitle = `${displayName} - ${municipio}, ${departamento || ''}`.trim()

  // Nombre real de la propiedad: se usará en datos estructurados para Google
  const propertyName = glamping.nombrePropiedad || glamping.nombreGlamping

  // Descripción limpia: quita frases de relleno y muestra precio
  const rawDesc = (glamping.descripcionGlamping ?? '')
    .replace(/\*?este glamping te ofrece\*?[\s:,]*/gi, '')
    .replace(/\*?ven y disfruta\*?[\s,]*/gi, '')
    .trim()

  const precioDesc = glamping.precioNoche
    ? `Desde $${Math.round(calcularComision(glamping.precioNoche)).toLocaleString('es-CO')}/noche. `
    : ''

  const ogDesc = (precioDesc + rawDesc).slice(0, 160)

  return {
    title: `${displayName} | Glamping en ${glamping.ciudadDepartamento} | Glamperos`,
    description: ogDesc,
    openGraph: {
      title: shareTitle,  // "La Choza - San Francisco, Cundinamarca"
      description: ogDesc,
      images: firstImage ? [{ url: firstImage, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,  // Mismo formato para Twitter/X
      description: ogDesc,
      images: firstImage ? [firstImage] : undefined,
    },
    alternates: {
      canonical: `/glamping/${id}`,
    },
    other: {
      'property-name': propertyName,
    },
  }
}

export default async function GlampingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const glamping = await getGlamping(id)

  if (!glamping) notFound()

  const glampingUrl = `${SITE_URL}/glamping/${id}`

  // Nombre visible para el usuario
  const displayName = glamping.nombreGlamping

  // Nombre real de la propiedad para Google
  const propertyName = glamping.nombrePropiedad || glamping.nombreGlamping

  const lodgingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',

    // Google puede leer el nombre real de la propiedad
    name: propertyName,

    // Google también entiende el nombre visible/comercial del glamping
    ...(propertyName !== displayName
      ? { alternateName: displayName }
      : {}),

    description: glamping.descripcionGlamping,
    url: glampingUrl,
    image: glamping.imagenes,
    address: {
      '@type': 'PostalAddress',
      addressLocality: glamping.ciudadDepartamento,
      addressCountry: 'CO',
    },
    geo: glamping.ubicacion
      ? {
          '@type': 'GeoCoordinates',
          latitude: glamping.ubicacion.lat,
          longitude: glamping.ubicacion.lng,
        }
      : undefined,
    aggregateRating:
      glamping.totalCalificaciones > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: glamping.calificacion,
            reviewCount: glamping.totalCalificaciones,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    priceRange: glamping.precioNoche
      ? `COP ${glamping.precioNoche.toLocaleString('es-CO')}`
      : undefined,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: {
          '@id': SITE_URL,
          name: 'Inicio',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: glamping.ciudadDepartamento,
        item: {
          '@id': `${SITE_URL}/?ciudad=${encodeURIComponent(glamping.ciudadDepartamento)}`,
          name: glamping.ciudadDepartamento,
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayName,
        item: {
          '@id': glampingUrl,
          name: displayName,
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GlampingDetailClient glamping={glamping} />
    </>
  )
}