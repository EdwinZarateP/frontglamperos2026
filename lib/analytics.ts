/**
 * Google Analytics 4 - Eventos de E-commerce
 * Documentación: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

interface PurchaseItem {
  item_id: string
  item_name: string
  quantity: number
  price: number
  item_category?: string
  item_brand?: string
  item_variant?: string
  location_id?: string
}

interface PurchaseEventParams {
  transaction_id: string
  value: number
  currency: string
  items: PurchaseItem[]
}

/**
 * Envía el evento purchase a GA4 cuando se completa una transacción
 */
export function trackPurchase(params: PurchaseEventParams): void {
  if (typeof window === 'undefined' || !window.gtag) {
    console.warn('[GA4] gtag no disponible - evento purchase no enviado', params)
    return
  }

  try {
    window.gtag('event', 'purchase', {
      transaction_id: params.transaction_id,
      value: params.value,
      currency: params.currency,
      items: params.items,
    })
    console.log('[GA4] Evento purchase enviado:', params)
  } catch (error) {
    console.error('[GA4] Error al enviar evento purchase:', error)
  }
}

/**
 * Construye el objeto item para el evento purchase desde una reserva
 */
export function buildPurchaseItemFromReserva(reserva: {
  _id?: string
  glampingId?: string
  glamping?: {
    _id?: string
    nombreGlamping?: string
    ciudadDepartamento?: string
    tipoGlamping?: string
  }
  tipo?: 'NOCHES' | 'PASADIA'
  fechaInicio?: string
  fechaFin?: string
  fecha?: string
  cantidadNoches?: number
  precioTotal?: number
}): PurchaseItem {
  return {
    item_id: reserva.glampingId || reserva.glamping?._id || 'unknown',
    item_name: reserva.glamping?.nombreGlamping || 'Glamping',
    quantity: 1,
    price: reserva.precioTotal || 0,
    item_category: reserva.glamping?.tipoGlamping || 'Glamping',
    item_brand: 'Glamperos',
    item_variant: reserva.tipo === 'PASADIA' ? 'Pasadía' : 'Por noches',
    location_id: reserva.glamping?.ciudadDepartamento || 'Colombia',
  }
}

// Tipos para window.gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}
