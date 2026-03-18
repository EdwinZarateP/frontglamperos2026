import type { FiltrosHome, HomeResponse } from '@/types'
import { CIUDADES_COLOMBIA, getCoordenadas } from './colombia'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const FILTROS_TIPOS: Record<string, string> = {
  domo:       'Domos',
  cabana:     'Cabañas',
  chalet:     'Chalets',
  tiny_house: 'Tiny Houses',
  tipi:       'Tipis',
  burbuja:    'Burbujas',
  treehouse:  'Casas en árbol',
}

export const FILTROS_AMENIDADES: Record<string, string> = {
  jacuzzi: 'Glamping con Jacuzzi',
  piscina: 'Glamping con Piscina',
}

export async function fetchGlampingsSSR(filtros: Partial<FiltrosHome>): Promise<HomeResponse | undefined> {
  try {
    const params = new URLSearchParams({ page: '1', limit: '20', order_by: 'calificacion' })
    // Si hay coordenadas, buscamos por radio (no por ciudad exacta)
    const usarCiudad = !filtros.lat && filtros.ciudad
    if (usarCiudad)              params.set('ciudad',      filtros.ciudad!)
    if (filtros.tipo)            params.set('tipo',        filtros.tipo)
    if (filtros.amenidades)      params.set('amenidades',  filtros.amenidades)
    if (filtros.huespedes)       params.set('huespedes',   String(filtros.huespedes))
    if (filtros.fecha_inicio)    params.set('fecha_inicio', filtros.fecha_inicio)
    if (filtros.fecha_fin)       params.set('fecha_fin',   filtros.fecha_fin)
    if (filtros.acepta_mascotas) params.set('acepta_mascotas', '1')
    if (filtros.lat != null)     params.set('lat',         String(filtros.lat))
    if (filtros.lng != null)     params.set('lng',         String(filtros.lng))
    if (filtros.radio_km != null) params.set('radio_km',  String(filtros.radio_km))
    if (filtros.precio_max)      params.set('precio_max',  String(filtros.precio_max))
    if (filtros.order_by)        params.set('order_by',    filtros.order_by)
    const res = await fetch(`${API_URL}/glampings/home?${params}`, { next: { revalidate: 300 } })
    if (!res.ok) return undefined
    return res.json()
  } catch {
    return undefined
  }
}

/** Busca la ciudad en el catálogo y devuelve su objeto */
export function findCiudadBySlug(slug: string) {
  return CIUDADES_COLOMBIA.find((c) => c.slug === slug) ?? null
}

/** Busca la ciudad por nombre (para construir la URL) */
export function findCiudadByNombre(ciudad: string) {
  return CIUDADES_COLOMBIA.find(
    (c) => c.ciudad.toLowerCase() === ciudad.toLowerCase() ||
           c.label.toLowerCase() === ciudad.toLowerCase()
  ) ?? null
}

/** Filtros → URL limpia con path segments + query params opcionales */
export function buildUrlFromFiltros(filtros: Partial<FiltrosHome>): string {
  const parts: string[] = []

  // 1. Ciudad
  if (filtros.ciudad) {
    const found = findCiudadByNombre(filtros.ciudad)
    if (found) parts.push(found.slug)
  }
  // 2. Tipo de glamping
  if (filtros.tipo && FILTROS_TIPOS[filtros.tipo]) {
    parts.push(filtros.tipo)
  }
  // 3. Amenidades "principales" → van como segmentos del path (jacuzzi, piscina)
  //    Las demás (wifi, fogata, etc.) van como query param
  const amenList = filtros.amenidades ? filtros.amenidades.split(',') : []
  const amenSlug   = amenList.filter(a => FILTROS_AMENIDADES[a])
  const amenQuery  = amenList.filter(a => !FILTROS_AMENIDADES[a])
  amenSlug.forEach(a => parts.push(a))

  const path = parts.length ? '/' + parts.join('/') : '/'

  const params = new URLSearchParams()
  if (filtros.huespedes && filtros.huespedes > 2) params.set('huespedes', String(filtros.huespedes))
  if (filtros.fecha_inicio)  params.set('fecha_inicio', filtros.fecha_inicio)
  if (filtros.fecha_fin)     params.set('fecha_fin',    filtros.fecha_fin)
  if (filtros.acepta_mascotas) params.set('mascotas',   '1')
  if (filtros.precio_max)    params.set('precio_max',   String(filtros.precio_max))
  if (amenQuery.length)      params.set('amenidades',   amenQuery.join(','))

  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Parsea los slug segments del path → FiltrosHome */
export function parseFiltrosFromSlug(slugs: string[]): Partial<FiltrosHome> | null {
  const f: Partial<FiltrosHome> = {}
  let valid = false

  for (const seg of slugs) {
    const ciudad = findCiudadBySlug(seg)
    if (ciudad) {
      f.ciudad = ciudad.label
      const coords = getCoordenadas(ciudad.ciudad, ciudad.departamento)
      if (coords) { f.lat = coords.lat; f.lng = coords.lng; f.radio_km = 130 }
      valid = true
      continue
    }
    if (FILTROS_TIPOS[seg]) {
      f.tipo = seg
      valid = true
      continue
    }
    // Amenidades principales como segmento del path (/jacuzzi, /piscina)
    if (FILTROS_AMENIDADES[seg]) {
      const prev = f.amenidades ? f.amenidades.split(',') : []
      f.amenidades = [...prev, seg].join(',')
      valid = true
      continue
    }
  }

  return valid ? f : null
}

/** Parsea ?query params → FiltrosHome */
export function parseFiltrosFromSearchParams(sp: Record<string, string>): Partial<FiltrosHome> {
  const f: Partial<FiltrosHome> = {}
  if (sp.ciudad) {
    const found = findCiudadByNombre(sp.ciudad)
    f.ciudad = found ? found.label : sp.ciudad
    if (found) {
      const coords = getCoordenadas(found.ciudad, found.departamento)
      if (coords) { f.lat = coords.lat; f.lng = coords.lng; f.radio_km = 130 }
    }
  }
  if (sp.tipo)         f.tipo         = sp.tipo
  if (sp.huespedes)    f.huespedes    = Number(sp.huespedes)
  if (sp.fecha_inicio) f.fecha_inicio = sp.fecha_inicio
  if (sp.fecha_fin)    f.fecha_fin    = sp.fecha_fin
  if (sp.mascotas)     f.acepta_mascotas = true
  if (sp.lat)          f.lat          = Number(sp.lat)
  if (sp.lng)          f.lng          = Number(sp.lng)
  if (sp.radio_km)     f.radio_km     = Number(sp.radio_km)
  if (sp.precio_max)   f.precio_max   = Number(sp.precio_max)
  if (sp.amenidades) {
    // Combina con las amenidades que ya vengan del slug (sin duplicados)
    const prev = f.amenidades ? f.amenidades.split(',') : []
    const extra = sp.amenidades.split(',').filter(a => !prev.includes(a))
    if (extra.length) f.amenidades = [...prev, ...extra].join(',')
  }
  return f
}

export function buildSeoMeta(filtros: Partial<FiltrosHome>): { title: string; description: string } {
  const tipoLabel   = filtros.tipo ? (FILTROS_TIPOS[filtros.tipo] ?? 'Glamping') : 'Glamping'
  const ciudadLabel = filtros.ciudad ? ` cerca a ${filtros.ciudad}` : ' en Colombia'
  const amenLabel   = filtros.amenidades
    ? ' con ' + filtros.amenidades.split(',')
        .map(a => FILTROS_AMENIDADES[a] ?? a)
        .join(' y ')
    : ''
  return {
    title: `${tipoLabel}${amenLabel}${ciudadLabel} — Glamperos`,
    description: `Encuentra y reserva ${tipoLabel.toLowerCase()}${amenLabel}${ciudadLabel}. Precios transparentes, reserva segura en Glamperos.`,
  }
}
