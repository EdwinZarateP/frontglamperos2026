import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Capitalización ──────────────────────────────────────────────────────────
export const toTitleCase = (str: string) =>
  str.trim().replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

// ─── Comisión escalonada Glamperos (igual que el backend) ────────────────────
export function calcularComision(precioAnfitrion: number): number {
  if (precioAnfitrion < 300_000) return precioAnfitrion * 1.20
  if (precioAnfitrion < 400_000) return precioAnfitrion * 1.16
  if (precioAnfitrion < 500_000) return precioAnfitrion * 1.15
  if (precioAnfitrion < 600_000) return precioAnfitrion * 1.13
  if (precioAnfitrion < 800_000) return precioAnfitrion * 1.11
  return precioAnfitrion * 1.10
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
  PAGO_RECIBIDO: 'Pago recibido',
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
