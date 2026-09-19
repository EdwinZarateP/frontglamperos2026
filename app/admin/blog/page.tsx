'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Languages, ArrowRight, RefreshCw } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

function MiniSpinner() {
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}

interface Contenido {
  titulo?: string
  slug?: string
  excerpt?: string
  html?: string
}

interface Borrador {
  _id: string
  fechaProgramada?: string
  tema: string
  estado: 'BORRADOR' | 'REGENERANDO' | 'PUBLICADO' | 'RECHAZADO' | 'ERROR'
  contenidoEs?: Contenido
  contenidoEn?: Contenido
  glampingNombre?: string
  imagenGlampingUrl?: string
  wpUrlEs?: string
  wpUrlEn?: string
  version: number
  createdAt: string
  error?: string | null
}

const ESTADO_STYLE: Record<string, string> = {
  BORRADOR:     'bg-amber-100 text-amber-700',
  REGENERANDO:  'bg-blue-100 text-blue-700 animate-pulse',
  PUBLICADO:    'bg-emerald-100 text-emerald-700',
  RECHAZADO:    'bg-red-100 text-red-600',
  ERROR:        'bg-red-100 text-red-600',
}

const ESTADOS = ['', 'BORRADOR', 'REGENERANDO', 'PUBLICADO', 'RECHAZADO', 'ERROR']

function fmtFecha(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

export default function AdminBlogPage() {
  const qc = useQueryClient()
  const [filtroEstado, setFiltroEstado] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog-borradores', filtroEstado],
    queryFn: async () =>
      (await api.get('/blog/borradores', {
        params: { limit: 50, ...(filtroEstado ? { estado: filtroEstado } : {}) },
      })).data,
    refetchInterval: (query) => {
      const borradores: Borrador[] = query.state.data?.borradores ?? []
      return borradores.some((b) => b.estado === 'REGENERANDO') ? 15000 : false
    },
  })

  const { data: estadoTraduccion } = useQuery({
    queryKey: ['admin-blog-traduccion'],
    queryFn: async () => (await api.get('/blog/traducir-existentes/estado')).data,
  })

  const generarMutation = useMutation({
    mutationFn: async () => (await api.post('/blog/generar')).data,
    onSuccess: (res) => {
      toast.success(res.message || 'Generación iniciada — listo en ~3 min')
      setTimeout(() => qc.invalidateQueries({ queryKey: ['admin-blog-borradores'] }), 5000)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const traducirMutation = useMutation({
    mutationFn: async () => (await api.post('/blog/traducir-existentes', { lote: 5 })).data,
    onSuccess: (res) => {
      toast.success(`Traducción iniciada (${res.pendientes} pendientes) — reaparece en unos minutos`)
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['admin-blog-traduccion'] })
      }, 30000)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const borradores: Borrador[] = data?.borradores ?? []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Blog</h1>
          <p className="text-xs text-stone-500">
            Generación diaria automática (ES + EN) con aprobación manual antes de publicar
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generarMutation.mutate()}
            disabled={generarMutation.isPending}
            className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generarMutation.isPending ? <MiniSpinner /> : <Sparkles size={14} />}
            Generar ahora
          </button>
          <button
            onClick={() => traducirMutation.mutate()}
            disabled={traducirMutation.isPending || !estadoTraduccion?.pendientes}
            title={estadoTraduccion?.pendientes ? `${estadoTraduccion.pendientes} posts pendientes de traducción` : 'No hay posts pendientes de traducción'}
            className="flex items-center gap-1.5 bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {traducirMutation.isPending ? <MiniSpinner /> : <Languages size={14} />}
            Traducir existentes
            {estadoTraduccion?.pendientes ? ` (${estadoTraduccion.pendientes})` : ''}
          </button>
        </div>
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-1.5 flex-wrap">
        {ESTADOS.map((e) => (
          <button
            key={e || 'todos'}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroEstado === e
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {e || 'Todos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 flex justify-center">
          <Spinner />
        </div>
      ) : borradores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-3xl mb-2">🏕️</p>
          <p className="text-sm text-stone-500">
            No hay borradores todavía. El cron diario genera uno cada mañana, o pulsa
            «Generar ahora».
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {borradores.map((b) => (
            <Link
              key={b._id}
              href={`/admin/blog/${b._id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-stone-200 p-4 hover:border-stone-300 hover:shadow-sm transition-all"
            >
              {/* Miniatura */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                {b.imagenGlampingUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imagenGlampingUrl} alt={b.glampingNombre || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🏕️</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  {b.contenidoEs?.titulo || b.tema}
                </p>
                <p className="text-xs text-stone-400 truncate">
                  {fmtFecha(b.createdAt)} · v{b.version}
                  {b.glampingNombre ? ` · 📍 ${b.glampingNombre}` : ''}
                  {b.estado === 'ERROR' && b.error ? ` · ⚠️ ${b.error.slice(0, 80)}` : ''}
                </p>
              </div>

              {/* Estado + acción */}
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${ESTADO_STYLE[b.estado] || 'bg-stone-100 text-stone-600'}`}>
                {b.estado}
              </span>
              <ArrowRight size={16} className="text-stone-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <p className="text-[11px] text-stone-400 flex items-center gap-1">
        <RefreshCw size={11} /> La lista se refresca automáticamente cada 15s mientras hay regeneraciones en curso.
      </p>
    </div>
  )
}
