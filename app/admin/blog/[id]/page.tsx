'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X, MessageSquarePlus, Pencil, ExternalLink } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface Contenido {
  titulo?: string
  slug?: string
  excerpt?: string
  html?: string
  metaDescripcion?: string
}

interface EventoHistorial {
  version?: number
  fecha: string
  accion: string
  autor?: string
  feedback?: string | null
  detalle?: string | null
}

interface Borrador {
  _id: string
  tema: string
  estado: 'BORRADOR' | 'REGENERANDO' | 'PUBLICADO' | 'RECHAZADO' | 'ERROR'
  contenidoEs?: Contenido
  contenidoEn?: Contenido
  glampingNombre?: string
  imagenGlampingUrl?: string
  wpUrlEs?: string
  wpUrlEn?: string
  version: number
  historial?: EventoHistorial[]
  createdAt: string
  error?: string | null
}

const ESTADO_STYLE: Record<string, string> = {
  BORRADOR:    'bg-amber-100 text-amber-700',
  REGENERANDO: 'bg-blue-100 text-blue-700 animate-pulse',
  PUBLICADO:   'bg-emerald-100 text-emerald-700',
  RECHAZADO:   'bg-red-100 text-red-600',
  ERROR:       'bg-red-100 text-red-600',
}

const ACCION_ICON: Record<string, string> = {
  GENERADO: '✨', REGENERADO: '🔁', EDITADO: '✏️', FEEDBACK: '💬',
  PUBLICADO: '🚀', RECHAZADO: '🚫', ERROR: '⚠️',
}

export default function AdminBlogDetallePage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'es' | 'en'>('es')
  const [feedback, setFeedback] = useState('')
  const [editando, setEditando] = useState(false)
  const [traducirIngles, setTraducirIngles] = useState(true)
  const [formEdit, setFormEdit] = useState({ tituloEs: '', excerptEs: '', htmlEs: '', tituloEn: '', excerptEn: '', htmlEn: '' })

  const { data: b, isLoading } = useQuery({
    queryKey: ['admin-blog-borrador', id],
    queryFn: async () => (await api.get(`/blog/borradores/${id}`)).data,
    refetchInterval: (query) =>
      query.state.data?.estado === 'REGENERANDO' ? 15000 : false,
    enabled: !!id,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-blog-borrador', id] })
    qc.invalidateQueries({ queryKey: ['admin-blog-borradores'] })
  }

  const feedbackMutation = useMutation({
    mutationFn: async () => (await api.post(`/blog/borradores/${id}/feedback`, { feedback })).data,
    onSuccess: (res) => {
      toast.success(res.message || 'Regenerando…')
      setFeedback('')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const publicarMutation = useMutation({
    mutationFn: async () => (await api.post(`/blog/borradores/${id}/publicar`)).data,
    onSuccess: (res) => {
      toast.success('¡Publicado en WordPress!')
      invalidate()
      if (res.wpUrlEs) window.open(res.wpUrlEs, '_blank')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const rechazarMutation = useMutation({
    mutationFn: async () => (await api.post(`/blog/borradores/${id}/rechazar`, {})).data,
    onSuccess: () => {
      toast.success('Borrador rechazado')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const despublicarMutation = useMutation({
    mutationFn: async () => (await api.post(`/blog/borradores/${id}/despublicar`)).data,
    onSuccess: (res) => {
      toast.success(res.message || 'Artículo retirado del blog')
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const editarMutation = useMutation({
    mutationFn: async () =>
      (await api.put(`/blog/borradores/${id}`, {
        tituloEs: formEdit.tituloEs || null,
        excerptEs: formEdit.excerptEs || null,
        htmlEs: formEdit.htmlEs || null,
        tituloEn: formEdit.tituloEn || null,
        excerptEn: formEdit.excerptEn || null,
        htmlEn: formEdit.htmlEn || null,
        traducirAlIngles: traducirIngles,
      }, { timeout: 240000 })).data, // la traducción puede tardar ~1-2 min
    onSuccess: async (res) => {
      if (res?.advertencia) {
        toast.error(res.advertencia, { duration: 8000 })
        setEditando(false)
        invalidate()
        return
      }
      // Si el artículo ya estaba publicado, los cambios se empujan a WordPress
      if (borrador?.estado === 'PUBLICADO') {
        toast.loading('Guardando y republicando…', { id: 'editar' })
        try {
          await api.post(`/blog/borradores/${id}/publicar`)
          toast.success('Cambios guardados y publicados en glamperos.com', { id: 'editar' })
        } catch (e) {
          toast.error('Guardado, pero falló la republicación: ' + getErrorMessage(e), { id: 'editar' })
        }
      } else {
        toast.success('Cambios guardados')
      }
      setEditando(false)
      invalidate()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!b) return <p className="text-center py-20 text-stone-400">Borrador no encontrado</p>

  const borrador = b as Borrador
  const contenido = tab === 'es' ? borrador.contenidoEs : borrador.contenidoEn
  const puedeActuar = borrador.estado === 'BORRADOR' || borrador.estado === 'ERROR'

  const abrirEdicion = () => {
    setFormEdit({
      tituloEs: borrador.contenidoEs?.titulo || '',
      excerptEs: borrador.contenidoEs?.excerpt || '',
      htmlEs: borrador.contenidoEs?.html || '',
      tituloEn: borrador.contenidoEn?.titulo || '',
      excerptEn: borrador.contenidoEn?.excerpt || '',
      htmlEn: borrador.contenidoEn?.html || '',
    })
    setEditando(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/blog" className="mt-1 text-stone-400 hover:text-stone-700">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-stone-900 truncate">
              {borrador.contenidoEs?.titulo || borrador.tema}
            </h1>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${ESTADO_STYLE[borrador.estado] || 'bg-stone-100 text-stone-600'}`}>
              {borrador.estado}
            </span>
            <span className="text-xs text-stone-400">v{borrador.version}</span>
          </div>
          <p className="text-xs text-stone-400">
            Tema: {borrador.tema}
            {borrador.glampingNombre ? ` · 📍 Imagen de ${borrador.glampingNombre}` : ''}
          </p>
          {borrador.estado === 'ERROR' && borrador.error && (
            <p className="text-xs text-red-600 mt-1">⚠️ {borrador.error}</p>
          )}
        </div>
      </div>

      {/* Links si ya está publicado */}
      {borrador.estado === 'PUBLICADO' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-sm">
          <a href={borrador.wpUrlEs} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-700 font-semibold hover:underline">
            🇪🇸 Ver en español <ExternalLink size={13} />
          </a>
          <a href={borrador.wpUrlEn} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-700 font-semibold hover:underline">
            🇺🇸 Ver en inglés <ExternalLink size={13} />
          </a>
          <button
            onClick={abrirEdicion}
            className="ml-auto flex items-center gap-1.5 bg-white border border-stone-200 text-stone-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-stone-50"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={() => {
              if (window.confirm('¿Retirar este artículo del blog? Dejará de ser visible en glamperos.com (queda como borrador en WordPress y puedes volver a publicarlo).')) despublicarMutation.mutate()
            }}
            disabled={despublicarMutation.isPending}
            className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-100 disabled:opacity-50"
          >
            <X size={14} /> {despublicarMutation.isPending ? 'Retirando…' : 'Despublicar'}
          </button>
        </div>
      )}

      {/* Imagen destacada */}
      {borrador.imagenGlampingUrl && (
        <div className="rounded-2xl overflow-hidden border border-stone-200 h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={borrador.imagenGlampingUrl} alt={borrador.glampingNombre || ''} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Tabs ES / EN */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('es')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === 'es' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
        >
          🇪🇸 Español
        </button>
        <button
          onClick={() => setTab('en')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${tab === 'en' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
        >
          🇺🇸 English
        </button>
      </div>

      {/* Preview del artículo */}
      {!editando ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-stone-900 mb-2" style={{ color: '#0D261B' }}>
            {contenido?.titulo}
          </h2>
          {contenido?.excerpt && (
            <p className="text-sm text-stone-500 italic mb-4">{contenido.excerpt}</p>
          )}
          <div
            className="admin-blog-preview text-stone-700 leading-relaxed text-[15px] space-y-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-stone-900 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:text-stone-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-emerald-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-stone-500"
            dangerouslySetInnerHTML={{ __html: contenido?.html || '<p>(sin contenido)</p>' }}
          />
        </div>
      ) : (
        /* ── Modo edición manual ── */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <p className="text-xs text-stone-500">
            {borrador.estado === 'PUBLICADO'
              ? 'Editando un artículo publicado — al guardar, los cambios se publican de inmediato en glamperos.com'
              : `Editando manualmente (versión ${borrador.version} → se registra en el historial)`}
          </p>
          {(['Es', 'En'] as const).map((idioma) => (
            <div key={idioma} className="space-y-2">
              <p className="text-xs font-bold text-stone-700">{idioma === 'Es' ? '🇪🇸 Español' : '🇺🇸 English'}</p>
              <input
                value={formEdit[`titulo${idioma}`]}
                onChange={(e) => setFormEdit({ ...formEdit, [`titulo${idioma}`]: e.target.value })}
                placeholder="Título"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={formEdit[`excerpt${idioma}`]}
                onChange={(e) => setFormEdit({ ...formEdit, [`excerpt${idioma}`]: e.target.value })}
                placeholder="Resumen (excerpt)"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm"
              />
              <textarea
                value={formEdit[`html${idioma}`]}
                onChange={(e) => setFormEdit({ ...formEdit, [`html${idioma}`]: e.target.value })}
                placeholder="HTML del artículo"
                rows={10}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>
          ))}
          <label className="flex items-start gap-2 text-xs text-stone-600 bg-amber-50 border border-amber-100 rounded-xl p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={traducirIngles}
              onChange={(e) => setTraducirIngles(e.target.checked)}
              className="mt-0.5 accent-emerald-600"
            />
            <span>
              <strong>Traducir mis cambios al inglés</strong> — reescribe la versión 🇺🇸 a partir del
              español editado (tarda ~1 min y reemplaza el contenido EN actual). Desmárcalo si editaste
              el inglés manualmente.
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => editarMutation.mutate()}
              disabled={editarMutation.isPending}
              className="bg-brand text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {editarMutation.isPending
                ? (traducirIngles ? 'Guardando y traduciendo… (hasta 2 min)' : 'Guardando…')
                : borrador.estado === 'PUBLICADO'
                  ? 'Guardar y publicar cambios'
                  : 'Guardar cambios'}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="bg-stone-100 text-stone-600 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-stone-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Acciones ── */}
      {puedeActuar && !editando && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          {/* Feedback → regenerar */}
          <div>
            <p className="text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
              <MessageSquarePlus size={14} /> Sugerir cambios (la IA regenera el artículo aplicándolos)
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ej: Hazlo más corto, enfócate en viajes con mascotas y agrega una sección sobre precios…"
              rows={3}
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => feedbackMutation.mutate()}
              disabled={feedbackMutation.isPending || feedback.trim().length < 10}
              className="mt-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40"
            >
              {feedbackMutation.isPending ? 'Enviando…' : `Regenerar (v${borrador.version + 1})`}
            </button>
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                if (window.confirm('¿Publicar en WordPress (español + inglés)?')) publicarMutation.mutate()
              }}
              disabled={publicarMutation.isPending}
              className="flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              <Check size={14} />
              {publicarMutation.isPending ? 'Publicando…' : 'Aprobar y publicar'}
            </button>
            <button
              onClick={abrirEdicion}
              className="flex items-center gap-1.5 bg-stone-100 text-stone-700 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-stone-200"
            >
              <Pencil size={14} /> Editar manualmente
            </button>
            <button
              onClick={() => {
                if (window.confirm('¿Rechazar este artículo? No se publicará.')) rechazarMutation.mutate()
              }}
              className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-red-100"
            >
              <X size={14} /> Rechazar
            </button>
          </div>
        </div>
      )}

      {/* ── Historial ── */}
      {borrador.historial && borrador.historial.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="text-xs font-bold text-stone-700 mb-3">Historial</p>
          <div className="space-y-2.5">
            {[...borrador.historial].reverse().map((h, i) => (
              <div key={i} className="flex gap-2.5 text-xs">
                <span>{ACCION_ICON[h.accion] || '•'}</span>
                <div className="min-w-0">
                  <p className="text-stone-700">
                    <strong>{h.accion}</strong>
                    {h.version ? ` · v${h.version}` : ''}
                    {h.fecha ? ` · ${new Date(h.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                    {h.autor === 'admin' ? ' · por ti' : ''}
                  </p>
                  {h.feedback && (
                    <p className="text-stone-500 italic border-l-2 border-stone-200 pl-2 mt-0.5">“{h.feedback}”</p>
                  )}
                  {h.detalle && <p className="text-stone-400">{h.detalle}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
