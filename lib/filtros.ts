import type { FiltrosHome, HomeResponse } from '@/types'
import { CIUDADES_COLOMBIA, getCoordenadas } from './colombia'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Departamentos principales de Colombia (slug → nombre completo)
export const FILTROS_DEPARTAMENTOS: Record<string, string> = {
  'antioquia': 'Antioquia',
  'boyaca': 'Boyacá',
  'cundinamarca': 'Cundinamarca',
  'santander': 'Santander',
  'bolivar': 'Bolívar',
  'narino': 'Nariño',
  'valle': 'Valle del Cauca',
  'atlantico': 'Atlántico',
  'magdalena': 'Magdalena',
  'huila': 'Huila',
  'tolima': 'Tolima',
  'risaralda': 'Risaralda',
  'quindio': 'Quindío',
  'caldas': 'Caldas',
  'cesar': 'Cesar',
  'la-guajira': 'La Guajira',
  'norte-de-santander': 'Norte de Santander',
  'meta': 'Meta',
  'cauca': 'Cauca',
  'choco': 'Chocó',
  'putumayo': 'Putumayo',
  'arauca': 'Arauca',
  'casanare': 'Casanare',
  'guainia': 'Guainía',
  'guaviare': 'Guaviare',
  'vaupes': 'Vaupés',
  'vichada': 'Vichada',
  'amazonas': 'Amazonas',
  'san-andres': 'San Andrés y Providencia',
  'sucre': 'Sucre',
  'cordoba': 'Córdoba',
}

export const FILTROS_TIPOS: Record<string, string> = {
  domo:       'Domos',
  cabana:     'Cabañas',
  chalet:     'Chalets',
  'tiny-house': 'Tiny Houses',
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
    const params = new URLSearchParams({ page: String(filtros.page ?? 1), limit: '20', order_by: 'calificacion' })
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
    const res = await fetch(`${API_URL}/glampings/home?${params}`, { next: { revalidate: 3600 } })
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
export function buildUrlFromFiltros(filtros: Partial<FiltrosHome>, preserveUtmParams?: URLSearchParams): string {
  const parts: string[] = []

  // 1. Ciudad o Departamento
  if (filtros.ciudad) {
    const found = findCiudadByNombre(filtros.ciudad)
    if (found) {
      parts.push(found.slug)
    } else {
      // Buscar si es un departamento
      const deptSlug = Object.entries(FILTROS_DEPARTAMENTOS).find(
        ([_, nombre]) => nombre === filtros.ciudad
      )?.[0]
      if (deptSlug) parts.push(deptSlug)
    }
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

  // 4. Ordenamiento por precio → /asc o /desc al final
  if (filtros.order_by === 'precio_asc') parts.push('asc')
  if (filtros.order_by === 'precio_desc') parts.push('desc')

  const path = parts.length ? '/' + parts.join('/') : '/'

  const params = new URLSearchParams()
  if (filtros.huespedes && filtros.huespedes > 2) params.set('huespedes', String(filtros.huespedes))
  if (filtros.fecha_inicio)  params.set('fecha_inicio', filtros.fecha_inicio)
  if (filtros.fecha_fin)     params.set('fecha_fin',    filtros.fecha_fin)
  if (filtros.acepta_mascotas) params.set('mascotas',   '1')
  if (filtros.precio_max)    params.set('precio_max',   String(filtros.precio_max))
  if (amenQuery.length)      params.set('amenidades',   amenQuery.join(','))
  // Incluir page si está presente y > 1 (page=1 no se muestra en URL para URLs limpias)
  if (filtros.page && filtros.page > 1) {
    params.set('page', String(filtros.page))
  }

  // PRESERVAR PARÁMETROS UTM para tracking de marketing
  if (preserveUtmParams) {
    const utmParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'gclid', 'fbclid', 'msclkid' // otros parámetros de tracking comunes
    ]
    utmParams.forEach(param => {
      const value = preserveUtmParams.get(param)
      if (value) params.set(param, value)
    })
  }

  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Parsea los slug segments del path → FiltrosHome */
export function parseFiltrosFromSlug(slugs: string[]): Partial<FiltrosHome> | null {
  const f: Partial<FiltrosHome> = {}
  let valid = false

  for (const seg of slugs) {
    // 1. Buscar ciudad específica primero (prioridad)
    const ciudad = findCiudadBySlug(seg)
    if (ciudad) {
      f.ciudad = ciudad.label
      const coords = getCoordenadas(ciudad.ciudad, ciudad.departamento)
      if (coords) { f.lat = coords.lat; f.lng = coords.lng; f.radio_km = 130 }
      valid = true
      continue
    }
    // 2. Buscar departamento
    if (FILTROS_DEPARTAMENTOS[seg]) {
      f.ciudad = FILTROS_DEPARTAMENTOS[seg]
      valid = true
      continue
    }
    // 3. Tipo de glamping
    if (FILTROS_TIPOS[seg]) {
      f.tipo = seg
      valid = true
      continue
    }
    // 4. Amenidades principales como segmento del path (/jacuzzi, /piscina)
    if (FILTROS_AMENIDADES[seg]) {
      const prev = f.amenidades ? f.amenidades.split(',') : []
      f.amenidades = [...prev, seg].join(',')
      valid = true
      continue
    }
    // 5. Ordenamiento por precio → /asc o /desc
    if (seg === 'asc') {
      f.order_by = 'precio_asc'
      valid = true
      continue
    }
    if (seg === 'desc') {
      f.order_by = 'precio_desc'
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
  if (sp.order_by)     f.order_by     = sp.order_by as 'precio_asc' | 'precio_desc' | 'distancia' | 'calificacion'
  if (sp.page && Number(sp.page) > 1) f.page = Number(sp.page)
  if (sp.amenidades) {
    // Combina con las amenidades que ya vengan del slug (sin duplicados)
    const prev = f.amenidades ? f.amenidades.split(',') : []
    const extra = sp.amenidades.split(',').filter(a => !prev.includes(a))
    if (extra.length) f.amenidades = [...prev, ...extra].join(',')
  }
  return f
}

// Textos intro específicos por ciudad (slug → intro)
const CITY_INTROS: Record<string, string> = {
  bogota: 'Escápate de la ciudad sin alejarte demasiado. A menos de 2 horas de Bogotá encontrarás cúpulas geodésicas, domos y cabañas de lujo rodeadas de la naturaleza de Cundinamarca.',
  medellin: 'Montañas, embalses y pueblos coloniales a pocas horas de Medellín. Antioquia ofrece algunas de las experiencias de glamping más espectaculares de Colombia.',
  cali: 'Cali, Jamundí, Dapa, Tuluá y alrededores. Descubre el Valle del Cauca con glampings únicos rodeados de naturaleza, caña de azúcar y paisajes verdes.',
  paipa: 'Aguas termales, historia y paisajes boyacenses de ensueño. Paipa es uno de los destinos de glamping más buscados de Colombia por su clima y gastronomía.',
  'villa-de-leyva': 'El pueblo colonial más bello de Colombia te espera. Domos y cabañas de lujo rodeados del paisaje árido y mágico de Villa de Leyva, Boyacá.',
  tinjaca: 'Entre viñedos y paisajes boyacenses, Tinjacá ofrece retiros de glamping únicos a pocos kilómetros de Villa de Leyva.',
  guatape: 'La Piedra del Peñol y el colorido zócalo de Guatapé te esperan. Glampings frente al embalse con vistas que no olvidarás.',
  barichara: 'El pueblo más lindo de Colombia tiene glampings de ensueño entre naturaleza, silencio y arquitectura colonial.',
  'san-gil': 'Capital del turismo de aventura en Colombia. Glamping en San Gil combina adrenalina, naturaleza y descanso total.',
  lebrija: 'Rodeado de cañones y ríos, Lebrija es el destino secreto de glamping en Santander para quienes buscan naturaleza sin multitudes.',
  velez: 'La tierra de la bocadillo veléño y los bosques santandereanos esconde glampings tranquilos ideales para desconectarse.',
  salento: 'Entre palmas de cera y cafetales, Salento es el corazón del Eje Cafetero. Glamping rodeado de naturaleza cafetera única en el mundo.',
  filandia: 'Uno de los pueblos patrimonio más encantadores del Quindío. Glampings con vista al valle del Cauca y los Andes colombianos.',
  cartagena: 'El Caribe colombiano en su máxima expresión. Glamping cerca a Cartagena para disfrutar sol, mar y cultura costeña.',
  'santa-marta': 'Entre la Sierra Nevada y el Caribe, Santa Marta ofrece glampings únicos cerca de Tayrona y Palomino.',
  girardota: 'A solo 30 minutos de Medellín, Girardota es el destino de glamping perfecto para un fin de semana en el norte antioqueño.',
  caldas: 'Sur del Valle de Aburrá con paisajes verdes y fincas tradicionales. Glamping en Caldas, Antioquia para descansar cerca a Medellín.',
  'la-estrella': 'Municipio del sur de Medellín con fácil acceso y naturaleza exuberante. Glamping en La Estrella para escapadas cortas.',
  'san-jeronimo': 'A orillas del río Cauca, San Jerónimo es el destino de glamping favorito de los paisas para escapadas de fin de semana.',
}

// Nombre corto de amenidad para usar en títulos (sin "Glamping con")
const AMENIDAD_SHORT: Record<string, string> = {
  jacuzzi: 'Jacuzzi',
  piscina: 'Piscina',
}

export interface CityPageContent {
  h1: string      // para el hero banner
  intro: string   // subtítulo debajo del h1
  hasFilters: boolean  // true si hay tipo o amenidades (no solo ciudad)
}

export function buildCityPageContent(
  filtros: Partial<FiltrosHome>,
  citySlug?: string,
): CityPageContent {
  const tieneFilters = !!(filtros.tipo || filtros.amenidades)
  const ciudadNombre = filtros.ciudad?.split(',')[0] ?? ''   // solo "Medellín", no "Medellín, Antioquia"
  const ciudadLabel  = ciudadNombre ? ` cerca a ${ciudadNombre}` : ' en Colombia'

  // Construir h1 limpio solo cuando hay filtros activos
  let h1 = ''
  if (tieneFilters) {
    const base = filtros.tipo ? (FILTROS_TIPOS[filtros.tipo] ?? 'Glamping') : 'Glamping'
    const amens = filtros.amenidades
      ? filtros.amenidades.split(',').map(a => AMENIDAD_SHORT[a] ?? a).join(' y ')
      : ''
    h1 = amens ? `${base} con ${amens}${ciudadLabel}` : `${base}${ciudadLabel}`
  }

  const intro = (citySlug && CITY_INTROS[citySlug])
    ? CITY_INTROS[citySlug]
    : ciudadNombre
      ? `Encuentra los mejores glampings cerca a ${ciudadNombre}. Domos geodésicos, cabañas de lujo y experiencias únicas en la naturaleza colombiana.`
      : 'Descubre glamping en Colombia. Domos, cabañas de lujo y experiencias únicas en la naturaleza. Reserva fácil y seguro en Glamperos.'

  return { h1, intro, hasFilters: tieneFilters }
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
