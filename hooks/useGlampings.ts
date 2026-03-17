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
    queryKey: ['glampings-home', filtros],
    queryFn: async () => {
      const { data } = await api.get('/glampings/home', { params: filtros })
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
