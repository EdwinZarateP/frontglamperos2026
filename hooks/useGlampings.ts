'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { FiltrosHome, HomeResponse, Glamping, Cotizacion, CalificacionesResponse } from '@/types'

// ─── Tipos de glamping (desde la API) ─────────────────────────────────────────
export function useTiposGlamping() {
  return useQuery<string[]>({
    queryKey: ['glamping-tipos'],
    queryFn: async () => {
      const { data } = await api.get('/glampings/tipos')
      return data
    },
    staleTime: Infinity, // son datos estáticos (enum del back)
  })
}

// ─── Home Listing ─────────────────────────────────────────────────────────────
export function useGlampingsHome(filtros: FiltrosHome, enabled = true) {
  return useQuery<HomeResponse>({
    queryKey: ['glampings-home', JSON.stringify(filtros)], // Stringify para asegurar detección de cambios
    queryFn: async () => {
      // Si tenemos coordenadas, buscamos por radio y NO por nombre de ciudad
      // (así Funza devuelve glampings cercanos aunque no haya ninguno en Funza exactamente)
      const { ciudad: _ciudad, ...rest } = filtros
      const params = filtros.lat != null && filtros.lng != null ? rest : filtros
      const { data } = await api.get('/glampings/home', { params })
      return data
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData, // evita flash de "sin resultados" entre filtros
    enabled,
  })
}

// ─── Detalle ──────────────────────────────────────────────────────────────────
export function useGlamping(id: string) {
  return useQuery<Glamping>({
    queryKey: ['glamping', id],
    queryFn: async () => {
      const { data } = await api.get(`/glampings/${id}`)
      return data
    },
    enabled: !!id,
  })
}

// ─── Cotización ───────────────────────────────────────────────────────────────
export function useCotizacion(
  glampingId: string,
  params: {
    fecha_inicio?: string
    fecha_fin?: string
    huespedes?: number
    huespedes_adicionales?: number
    extras?: string
  }
) {
  const enabled =
    !!glampingId && !!params.fecha_inicio && !!params.fecha_fin && !!params.huespedes
  return useQuery<Cotizacion>({
    queryKey: ['cotizacion', glampingId, params],
    queryFn: async () => {
      const { data } = await api.get(`/glampings/${glampingId}/cotizar`, { params })
      return data
    },
    enabled,
    staleTime: 30_000,
  })
}

// ─── Calificaciones ───────────────────────────────────────────────────────────
export function useCalificaciones(glampingId: string) {
  return useQuery<CalificacionesResponse>({
    queryKey: ['calificaciones', glampingId],
    queryFn: async () => {
      const { data } = await api.get(`/calificaciones/glamping/${glampingId}`)
      return data
    },
    enabled: !!glampingId,
  })
}

// ─── Fechas bloqueadas (para calendario cliente) ──────────────────────────────
export function useFechasBloqueadas(glampingId: string, meses = 3) {
  return useQuery<string[]>({
    queryKey: ['fechas-bloqueadas', glampingId, meses],
    queryFn: async () => {
      const { data } = await api.get(`/glampings/${glampingId}/fechas-bloqueadas`, {
        params: { meses },
      })
      return data as string[]
    },
    enabled: !!glampingId,
    staleTime: 60_000,
  })
}

// ─── Favoritos ────────────────────────────────────────────────────────────────
export function useFavoritos() {
  return useQuery<HomeResponse>({
    queryKey: ['favoritos'],
    queryFn: async () => {
      const { data } = await api.get('/usuarios/me/favoritos')
      return data
    },
  })
}
