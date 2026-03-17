import type { FiltrosHome, HomeResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function fetchGlampingsSSR(filtros: Partial<FiltrosHome>): Promise<HomeResponse | undefined> {
  try {
    const params = new URLSearchParams({ page: '1', limit: '20', order_by: 'calificacion' })
    if (filtros.tipo)        params.set('tipo',       filtros.tipo)
    if (filtros.amenidades)  params.set('amenidades', filtros.amenidades)
    if (filtros.lat != null) params.set('lat',        String(filtros.lat))
    if (filtros.lng != null) params.set('lng',        String(filtros.lng))
    if (filtros.radio_km != null) params.set('radio_km', String(filtros.radio_km))
    if (filtros.order_by)    params.set('order_by',   filtros.order_by)
    const res = await fetch(`${API_URL}/glampings/home?${params}`, { next: { revalidate: 300 } })
    if (!res.ok) return undefined
    return res.json()
  } catch {
    return undefined
  }
}

// ─── Catálogos de filtros rápidos ─────────────────────────────────────────────

export const FILTROS_CIUDADES: Record<string, { label: string; lat: number; lng: number }> = {
  bogota:   { label: 'Bogotá',   lat: 4.71,  lng: -74.07 },
  medellin: { label: 'Medellín', lat: 6.24,  lng: -75.58 },
}

export const FILTROS_TIPOS: Record<string, string> = {
  domo:       'Domos',
  cabana:     'Cabañas',
  chalet:     'Chalets',
  tiny_house: 'Tiny Houses',
  tipi:       'Tipis',
}

export const FILTROS_AMENIDADES: Record<string, string> = {
  jacuzzi: 'Glamping con Jacuzzi',
  piscina: 'Glamping con Piscina',
}

// ─── Parseo slug → filtros ────────────────────────────────────────────────────

export function buildFiltrosFromSlug(slug: string[]): Partial<FiltrosHome> {
  let ciudadKey: string | null = null
  let tipo: string | null = null
  let amenidad: string | null = null

  for (const seg of slug) {
    if (FILTROS_CIUDADES[seg])  ciudadKey = seg
    else if (FILTROS_TIPOS[seg])     tipo = seg
    else if (FILTROS_AMENIDADES[seg]) amenidad = seg
  }

  const filtros: Partial<FiltrosHome> = {}
  if (ciudadKey) {
    const c = FILTROS_CIUDADES[ciudadKey]
    filtros.lat      = c.lat
    filtros.lng      = c.lng
    filtros.order_by = 'distancia'
    filtros.radio_km = 100
  }
  if (tipo)     filtros.tipo      = tipo
  if (amenidad) filtros.amenidades = amenidad

  return filtros
}

// ─── Filtros → slug (para router.push) ───────────────────────────────────────

export function buildSlugFromFiltros(
  filtros: Pick<FiltrosHome, 'lat' | 'lng' | 'tipo' | 'amenidades'>
): string[] {
  const parts: string[] = []

  // 1. Ciudad (siempre primero)
  if (filtros.lat != null && filtros.lng != null) {
    for (const [slug, city] of Object.entries(FILTROS_CIUDADES)) {
      if (city.lat === filtros.lat && city.lng === filtros.lng) {
        parts.push(slug)
        break
      }
    }
  }

  // 2. Tipo (segundo)
  if (filtros.tipo && FILTROS_TIPOS[filtros.tipo]) {
    parts.push(filtros.tipo)
  }

  // 3. Amenidad (siempre al final)
  if (filtros.amenidades) {
    const first = filtros.amenidades.split(',')[0]
    if (FILTROS_AMENIDADES[first]) parts.push(first)
  }

  return parts
}

export function buildUrlFromFiltros(
  filtros: Pick<FiltrosHome, 'lat' | 'lng' | 'tipo' | 'amenidades'>
): string {
  const parts = buildSlugFromFiltros(filtros)
  return parts.length ? '/' + parts.join('/') : '/'
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export function buildSeoMeta(slug: string[]): { title: string; description: string } {
  let ciudadKey: string | null = null
  let tipo: string | null = null
  let amenidad: string | null = null

  for (const seg of slug) {
    if (FILTROS_CIUDADES[seg])   ciudadKey = seg
    else if (FILTROS_TIPOS[seg])      tipo = seg
    else if (FILTROS_AMENIDADES[seg]) amenidad = seg
  }

  const tipoLabel  = tipo ? FILTROS_TIPOS[tipo] : amenidad ? FILTROS_AMENIDADES[amenidad] : 'Glamping'
  const ciudadLabel = ciudadKey ? ` cerca a ${FILTROS_CIUDADES[ciudadKey].label}` : ' en Colombia'

  return {
    title: `${tipoLabel}${ciudadLabel} — Glamperos`,
    description: `Encuentra y reserva ${tipoLabel.toLowerCase()}${ciudadLabel}. Precios transparentes, reserva segura en Glamperos.`,
  }
}
