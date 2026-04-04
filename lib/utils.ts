import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Capitalización ──────────────────────────────────────────────────────────
export const toTitleCase = (str: string) =>
  str.trim().replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

// ─── Comisión escalonada Glamperos ───────────────────────────────────────────
// Fuente de verdad: apiglamperos2026/core/comision.py
// El frontend carga los tramos desde GET /catalogos/comisiones al arrancar.
// Si la carga falla, usa estos valores de fallback (deben coincidir con el backend).

interface TramoComision { desde: number; hasta: number | null; multiplicador: number }

const FALLBACK_TRAMOS: TramoComision[] = [
  { desde: 0,       hasta: 300_000, multiplicador: 1.20 },
  { desde: 300_000, hasta: 400_000, multiplicador: 1.17 },
  { desde: 400_000, hasta: 500_000, multiplicador: 1.15 },
  { desde: 500_000, hasta: 600_000, multiplicador: 1.13 },
  { desde: 600_000, hasta: 800_000, multiplicador: 1.11 },
  { desde: 800_000, hasta: null,    multiplicador: 1.10 },
]

let _tramos: TramoComision[] = FALLBACK_TRAMOS

export async function cargarTramosComision(): Promise<void> {
  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${API}/catalogos/comisiones`, { next: { revalidate: 3600 } })
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data.tramos) && data.tramos.length > 0) {
      _tramos = data.tramos
    }
  } catch {
    // fallback silencioso
  }
}

export function calcularComision(precioAnfitrion: number): number {
  if (precioAnfitrion <= 0) return 0
  for (const tramo of _tramos) {
    if (tramo.hasta === null || precioAnfitrion < tramo.hasta) {
      return precioAnfitrion * tramo.multiplicador
    }
  }
  return precioAnfitrion * _tramos[_tramos.length - 1].multiplicador
}

// ─── Formateo de precios COP ─────────────────────────────────────────────────
export const formatCOP = (amount: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)

// ─── Formateo de fechas ───────────────────────────────────────────────────────
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })
}

export const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Colores de estado de reserva ────────────────────────────────────────────
export const estadoColors: Record<string, string> = {
  PENDIENTE_APROBACION: 'bg-yellow-100 text-yellow-800',
  CONFIRMADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  COMPLETADA: 'bg-blue-100 text-blue-800',
  PAGO_RECIBIDO: 'bg-purple-100 text-purple-800',
}

export const estadoLabel: Record<string, string> = {
  PENDIENTE_APROBACION: 'Pendiente de aprobación',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
  PAGO_RECIBIDO: '💳 Pago Wompi · Pendiente aprobación',
}

// ─── Iconos de amenidades ─────────────────────────────────────────────────────
export const amenidadIconos: Record<string, string> = {
  wifi: '📶',
  jacuzzi: '🛁',
  piscina: '🏊',
  fogata: '🔥',
  parqueadero: '🅿️',
  bbq: '🍖',
  cocina: '🍳',
  aire_acondicionado: '❄️',
  chimenea: '🏠',
  vista_montaña: '⛰️',
  vista_mar: '🌊',
  desayuno: '🍳',
  mascotas: '🐾',
  senderos: '🥾',
  zona_juegos: '🎮',
}

export const tipoGlampingLabels: Record<string, string> = {
  domo:       'Domo',
  cabana:     'Cabaña',
  tiny_house: 'Tiny House',
  lumipod:    'Lumipod',
  chalet:     'Chalet',
  tipi:       'Tipi',
  loto:       'Loto',
}

// ─── Calcula noches entre 2 fechas ────────────────────────────────────────────
export const calcularNoches = (inicio: string, fin: string): number => {
  const d1 = new Date(inicio)
  const d2 = new Date(fin)
  const diff = d2.getTime() - d1.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

// ─── Genera URL de imagen placeholder ────────────────────────────────────────
export const placeholderImg = (w = 400, h = 300): string =>
  `https://placehold.co/${w}x${h}/1a1a1a/ffffff?text=Glamperos`

// ─── Trunca texto ─────────────────────────────────────────────────────────────
export const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? text.slice(0, maxLength) + '...' : text

// ─── Festivos Colombia ────────────────────────────────────────────────────────
function _easterDate(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, month, day)
}

function _nextMonday(d: Date): Date {
  const day = d.getDay()
  if (day === 1) return d
  const r = new Date(d)
  r.setDate(r.getDate() + (day === 0 ? 1 : 8 - day))
  return r
}

/** Retorna Set de fechas festivas colombianas en formato 'yyyy-MM-dd' para el año dado */
export function colombianHolidays(year: number): Set<string> {
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const add = (d: Date) => holidays.add(fmt(d))
  const holidays = new Set<string>()
  const e = _easterDate(year)

  // Fijos
  add(new Date(year, 0, 1))   // Año Nuevo
  add(new Date(year, 4, 1))   // Día del Trabajo
  add(new Date(year, 6, 20))  // Independencia
  add(new Date(year, 7, 7))   // Batalla de Boyacá
  add(new Date(year, 11, 8))  // Inmaculada Concepción
  add(new Date(year, 11, 25)) // Navidad

  // Semana Santa (fijos)
  const juevesSanto = new Date(e); juevesSanto.setDate(e.getDate() - 3); add(juevesSanto)
  const viernesSanto = new Date(e); viernesSanto.setDate(e.getDate() - 2); add(viernesSanto)

  // Trasladables al siguiente lunes (Ley Emiliani)
  add(_nextMonday(new Date(year, 0, 6)))   // Reyes Magos
  add(_nextMonday(new Date(year, 2, 19)))  // San José
  const asc = new Date(e); asc.setDate(e.getDate() + 39); add(_nextMonday(asc))        // Ascensión
  const corp = new Date(e); corp.setDate(e.getDate() + 60); add(_nextMonday(corp))     // Corpus Christi
  const sac = new Date(e); sac.setDate(e.getDate() + 68); add(_nextMonday(sac))        // Sagrado Corazón
  add(_nextMonday(new Date(year, 5, 29)))  // San Pedro y San Pablo
  add(_nextMonday(new Date(year, 7, 15)))  // Asunción
  add(_nextMonday(new Date(year, 9, 12)))  // Día de la Raza
  add(_nextMonday(new Date(year, 10, 1))) // Todos los Santos
  add(_nextMonday(new Date(year, 10, 11)))// Independencia de Cartagena

  return holidays
}

// ─── Convierte objeto a FormData ──────────────────────────────────────────────
export const toFormData = (obj: Record<string, unknown>): FormData => {
  const fd = new FormData()
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (value instanceof File) {
      fd.append(key, value)
    } else if (Array.isArray(value)) {
      fd.append(key, value.join(','))
    } else if (typeof value === 'object') {
      fd.append(key, JSON.stringify(value))
    } else {
      fd.append(key, String(value))
    }
  })
  return fd
}
