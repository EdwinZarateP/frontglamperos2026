'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star, MapPin, Users, Moon, Dog, Clock, ChevronLeft,
  Heart, Share2, CheckCircle, Youtube, Play, X, Copy
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCalificaciones, useCotizacion } from '@/hooks/useGlampings'
import { Button } from '@/components/ui/Button'
import { formatCOP, formatDate, amenidadIconos, calcularNoches, tipoGlampingLabels } from '@/lib/utils'
import type { Glamping } from '@/types'
const MapaVista = dynamic(() => import('@/components/ui/MapaVista').then(m => m.MapaVista), { ssr: false })

interface Props {
  glamping: Glamping
}

export function GlampingDetailClient({ glamping }: Props) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()

  const [imgIdx, setImgIdx] = useState(0)
  const touchStartX = useRef(0)
  const [esFav, setEsFav] = useState(false)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [huespedes, setHuespedes] = useState(1)
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<string[]>([])
  const [showAllAmenidades, setShowAllAmenidades] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const { data: calificaciones } = useCalificaciones(glamping._id)
  const extrasParam = extrasSeleccionados.join(',')
  const { data: cotizacion, isLoading: loadingCotizacion } = useCotizacion(glamping._id, {
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    huespedes,
    extras: extrasParam || undefined,
  })

  const noches = calcularNoches(fechaInicio, fechaFin)
  const imagenes = glamping.imagenes?.length
    ? glamping.imagenes
    : ['https://placehold.co/1200x800/1a1a1a/ffffff?text=Sin+imagen']

  const toggleFavorito = useMutation({
    mutationFn: async () => {
      if (esFav) {
        await api.delete(`/usuarios/me/favoritos/${glamping._id}`)
      } else {
        await api.post('/usuarios/me/favoritos', { glampingId: glamping._id })
      }
    },
    onSuccess: () => {
      setEsFav((v) => !v)
      toast.success(esFav ? 'Eliminado de favoritos' : 'Guardado en favoritos')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleReservar = () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para reservar')
      router.push('/auth/login')
      return
    }
    if (!fechaInicio || !fechaFin) {
      toast.error('Selecciona las fechas')
      return
    }
    const params = new URLSearchParams({
      fechaInicio,
      fechaFin,
      huespedes: String(huespedes),
      extras: extrasSeleccionados.join(','),
    })
    router.push(`/glamping/${glamping._id}/reservar?${params}`)
  }

  const toggleExtra = (key: string) => {
    setExtrasSeleccionados((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const amenidades = showAllAmenidades ? glamping.amenidades : glamping.amenidades.slice(0, 8)

  const buildWhatsAppText = () => {
    const tipo = tipoGlampingLabels[glamping.tipoGlamping] ?? glamping.tipoGlamping
    const comision = (p: number) => formatCOP(Math.round(p * 1.15))
    const lines: string[] = []

    lines.push(`🏕️ *${tipo} en ${glamping.ciudadDepartamento.split(',')[0].trim()}*`)
    lines.push(`📍 ${glamping.ciudadDepartamento}`)
    lines.push('')

    const t = glamping.tarifasNoche
    const diasLabels: [string, string][] = [
      ['lunes','Lunes'],['martes','Martes'],['miercoles','Miércoles'],
      ['jueves','Jueves'],['viernes','Viernes'],['sabado','Sábado'],['domingo','Domingo'],
    ]
    const tieneVariacion = t && diasLabels.some(([k]) => (t as Record<string,number>)[k] > 0)
    if (tieneVariacion && t) {
      lines.push('💰 *Precios por noche (incluye plataforma):*')
      for (const [key, label] of diasLabels) {
        const p = (t as Record<string,number>)[key] || glamping.precioNoche
        lines.push(`• ${label}: ${comision(p)}`)
      }
    } else {
      lines.push(`💰 *Precio por noche:* ${comision(glamping.precioNoche)}`)
    }
    lines.push('')

    const totalH = glamping.cantidadHuespedes + glamping.cantidadHuespedesAdicionales
    lines.push(`👥 Hasta ${totalH} huéspedes`)
    lines.push(`🌙 Mínimo ${glamping.minimoNoches} noche(s)`)
    lines.push(`🕐 Check-in: ${glamping.checkInNoche} | Check-out: ${glamping.checkOutNoche}`)
    if (glamping.aceptaMascotas) lines.push('🐾 Acepta mascotas')
    lines.push('')

    lines.push('📝 *Descripción:*')
    lines.push(glamping.descripcionGlamping)
    lines.push('')

    const extrasDisponibles = glamping.extras?.filter((e) => e.disponible) ?? []
    if (extrasDisponibles.length > 0) {
      lines.push('➕ *Extras disponibles:*')
      for (const extra of extrasDisponibles) {
        lines.push(`• ${extra.nombre}: ${formatCOP(extra.precioPublico)} (${extra.unidad.replace(/_/g, ' ')})`)
      }
      lines.push('')
    }

    lines.push(
      glamping.diasCancelacion
        ? `❌ Cancelación gratuita hasta ${glamping.diasCancelacion} días antes del check-in`
        : '❌ No admite cancelaciones'
    )

    return lines.join('\n')
  }

  const copiarInfo = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsAppText())
      toast.success('Info copiada al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-400 mb-4">
        <Link href="/" className="hover:text-stone-700 flex items-center gap-1">
          <ChevronLeft size={14} /> Inicio
        </Link>
        <span>/</span>
        <span className="text-stone-600">{glamping.ciudadDepartamento}</span>
        <span>/</span>
        <span className="text-stone-800 font-medium truncate">
          {tipoGlampingLabels[glamping.tipoGlamping] ?? glamping.tipoGlamping} en {glamping.ciudadDepartamento.split(',')[0].trim()}
        </span>
      </nav>

      {/* Título */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            {tipoGlampingLabels[glamping.tipoGlamping] ?? glamping.tipoGlamping} en {glamping.ciudadDepartamento.split(',')[0].trim()}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-stone-500">
            {glamping.calificacion > 0 && (
              <span className="flex items-center gap-1 font-medium text-stone-700">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                {glamping.calificacion.toFixed(1)}
                <span className="font-normal text-stone-400">({glamping.totalCalificaciones} reseñas)</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {glamping.ciudadDepartamento}
            </span>
            <span className="capitalize bg-stone-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {glamping.tipoGlamping}
            </span>
            {glamping.aceptaMascotas && (
              <span className="flex items-center gap-1 text-emerald-600">
                <Dog size={13} /> Acepta mascotas
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copiarInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 transition-colors"
            title="Copiar info para WhatsApp"
          >
            <Copy size={15} />
            <span className="hidden sm:inline">Copiar info</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('Enlace copiado')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 hover:bg-stone-50 text-sm text-stone-600 transition-colors"
          >
            <Share2 size={15} />
            <span className="hidden sm:inline">Compartir</span>
          </button>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Inicia sesión para guardar en favoritos')
                return
              }
              toggleFavorito.mutate()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
              esFav
                ? 'border-red-300 bg-red-50 text-red-500'
                : 'border-stone-200 hover:bg-stone-50 text-stone-600'
            }`}
          >
            <Heart size={15} className={esFav ? 'fill-red-500 text-red-500' : ''} />
            <span className="hidden sm:inline">{esFav ? 'Guardado' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Modal de video */}
      {showVideo && glamping.videoYoutube && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 flex items-center gap-1 text-sm"
            >
              <X size={18} /> Cerrar
            </button>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={glamping.videoYoutube.replace('watch?v=', 'embed/') + '?autoplay=1'}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay"
                title="Video del glamping"
              />
            </div>
          </div>
        </div>
      )}

      {/* Galería — móvil: carrusel / desktop: grid */}
      <div className="mb-8">
        {/* Móvil: imagen principal con indicador */}
        <div
          className="sm:hidden relative rounded-2xl overflow-hidden aspect-[4/3] bg-stone-100"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            const delta = touchStartX.current - e.changedTouches[0].clientX
            if (Math.abs(delta) > 50) {
              if (delta > 0) setImgIdx((i) => Math.min(imagenes.length - 1, i + 1))
              else setImgIdx((i) => Math.max(0, i - 1))
            }
          }}
        >
          <img
            src={imagenes[imgIdx]}
            alt={glamping.nombreGlamping}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => router.push(`/glamping/${glamping._id}/fotos?foto=${imgIdx}`)}
          />
          {imagenes.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => Math.max(0, i - 1)) }}
                disabled={imgIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow text-stone-700 disabled:opacity-0"
              >‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); setImgIdx((i) => Math.min(imagenes.length - 1, i + 1)) }}
                disabled={imgIdx === imagenes.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow text-stone-700 disabled:opacity-0"
              >›</button>
              <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {imgIdx + 1}/{imagenes.length}
              </span>
            </>
          )}
          {/* Botones acción móvil */}
          <div className="absolute top-3 left-3 flex gap-2">
            {glamping.videoYoutube && (
              <button
                onClick={() => setShowVideo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors"
              >
                <Play size={12} fill="white" /> Ver video
              </button>
            )}
          </div>
        </div>

        {/* Desktop: grid de fotos */}
        <div className="hidden sm:grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[360px] md:h-[420px]">
          <div className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group"
               onClick={() => router.push(`/glamping/${glamping._id}/fotos?foto=0`)}>
            <img
              src={imagenes[0]}
              alt={glamping.nombreGlamping}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Botones acción desktop sobre imagen principal */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              {glamping.videoYoutube && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowVideo(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/80 transition-colors"
                >
                  <Play size={12} fill="white" /> Ver video
                </button>
              )}
            </div>
          </div>
          {imagenes.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="relative overflow-hidden cursor-pointer group"
              onClick={() => router.push(`/glamping/${glamping._id}/fotos?foto=${i + 1}`)}
            >
              <img
                src={img}
                alt={`${glamping.nombreGlamping} ${i + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {i === 3 && imagenes.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                  <span className="text-white font-semibold text-sm">+{imagenes.length - 5} fotos</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Info básica */}
          <div className="flex flex-wrap gap-5 pb-8 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-600">
              <Users size={20} className="text-emerald-600" />
              <span className="text-sm">
                Hasta <strong>{glamping.cantidadHuespedes}</strong> huéspedes
                {glamping.cantidadHuespedesAdicionales > 0 &&
                  ` (+${glamping.cantidadHuespedesAdicionales} adicionales)`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Moon size={20} className="text-emerald-600" />
              <span className="text-sm">
                Mínimo <strong>{glamping.minimoNoches}</strong> noche(s)
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Clock size={20} className="text-emerald-600" />
              <span className="text-sm">
                Check-in: <strong>{glamping.checkInNoche}</strong> · Check-out:{' '}
                <strong>{glamping.checkOutNoche}</strong>
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-3">Sobre este glamping</h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">
              {glamping.descripcionGlamping}
            </p>
          </div>

          {/* Amenidades */}
          {glamping.amenidades?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-4">¿Qué ofrece?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenidades.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-stone-600 text-sm">
                    <span className="text-xl">{amenidadIconos[a] || '✓'}</span>
                    <span className="capitalize">{a.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              {glamping.amenidades.length > 8 && (
                <button
                  onClick={() => setShowAllAmenidades((v) => !v)}
                  className="mt-3 text-sm font-medium text-stone-700 underline hover:text-emerald-600"
                >
                  {showAllAmenidades
                    ? 'Ver menos'
                    : `Ver todas las ${glamping.amenidades.length} amenidades`}
                </button>
              )}
            </div>
          )}

          {/* Extras */}
          {glamping.extras?.filter((e) => e.disponible).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Servicios extras</h2>
              <div className="space-y-3">
                {glamping.extras
                  .filter((e) => e.disponible)
                  .map((extra) => {
                    const selected = extrasSeleccionados.includes(extra.key)
                    return (
                      <div
                        key={extra.key}
                        onClick={() => toggleExtra(extra.key)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300'
                            }`}
                          >
                            {selected && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <div>
                            <p className="font-medium text-stone-800 text-sm">{extra.nombre}</p>
                            <p className="text-xs text-stone-400 capitalize">
                              {extra.unidad.replace(/_/g, ' ')}
                              {extra.descripcion && ` · ${extra.descripcion}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-stone-700 text-sm">
                          {formatCOP(extra.precioPublico)}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Pasadía */}
          {glamping.permitePasadia && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-1">Acepta pasadía</h3>
              <p className="text-sm text-amber-700">
                Horario: {glamping.pasadiaHorarioInicio} – {glamping.pasadiaHorarioFin}
              </p>
            </div>
          )}

          {/* Políticas */}
          {glamping.politicasCasa && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-3">Políticas de la casa</h2>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl">
                {glamping.politicasCasa}
              </p>
            </div>
          )}

          {/* Cancelación */}
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Política de cancelación</h2>
            <p className="text-sm text-stone-600">
              {glamping.diasCancelacion
                ? `Cancelación gratuita hasta ${glamping.diasCancelacion} días antes del check-in.`
                : 'Este glamping no acepta cancelaciones.'}
            </p>
          </div>

          {/* Video YouTube */}
          {glamping.videoYoutube && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Youtube size={20} className="text-red-500" /> Video del glamping
              </h2>
              <button
                onClick={() => setShowVideo(true)}
                className="relative w-full aspect-video rounded-xl overflow-hidden group block"
              >
                {/* Thumbnail de YouTube */}
                <img
                  src={`https://img.youtube.com/vi/${glamping.videoYoutube.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1]}/hqdefault.jpg`}
                  alt="Video del glamping"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
                    <Play size={28} fill="white" className="text-white ml-1" />
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Mapa */}
          {glamping.ubicacion && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-3">Ubicación</h2>
              <div className="rounded-xl overflow-hidden border border-stone-200 h-64 sm:h-80">
                <MapaVista lat={glamping.ubicacion.lat} lng={glamping.ubicacion.lng} />
              </div>
              <p className="text-sm text-stone-500 mt-2 flex items-center gap-1">
                <MapPin size={13} /> {glamping.ciudadDepartamento}
              </p>
            </div>
          )}

          {/* Calificaciones */}
          {calificaciones && calificaciones.total > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                {glamping.calificacion.toFixed(1)} · {calificaciones.total} reseñas
              </h2>
              <div className="space-y-4">
                {calificaciones.calificaciones.map((c, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            size={13}
                            className={
                              s < Math.round(c.calificacion)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300'
                            }
                          />
                        ))}
                      </div>
                      {c.nombreTitular && (
                        <span className="text-sm font-medium text-stone-700">{c.nombreTitular}</span>
                      )}
                      <span className="text-xs text-stone-400 ml-auto">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600">{c.comentario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Cotizador sticky (desktop) */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-20">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6">
              <div className="mb-4">
                <span className="text-xs text-stone-400">Desde</span>
                <p className="text-2xl font-bold text-stone-900">
                  {formatCOP(glamping.precioNoche * 1.15)}
                  <span className="text-sm font-normal text-stone-400"> / noche</span>
                </p>
                {glamping.calificacion > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs text-stone-500">
                      {glamping.calificacion.toFixed(1)} · {glamping.totalCalificaciones} reseñas
                    </span>
                  </div>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs font-medium text-stone-500">Llegada</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setFechaInicio(e.target.value)
                      if (fechaFin && e.target.value >= fechaFin) setFechaFin('')
                    }}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500">Salida</label>
                  <input
                    type="date"
                    value={fechaFin}
                    min={fechaInicio || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Huéspedes */}
              <div className="mb-4">
                <label className="text-xs font-medium text-stone-500">Huéspedes</label>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => setHuespedes((h) => Math.max(1, h - 1))}
                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50"
                  >
                    −
                  </button>
                  <span className="font-medium text-stone-800">{huespedes}</span>
                  <button
                    onClick={() =>
                      setHuespedes((h) =>
                        Math.min(
                          glamping.cantidadHuespedes + glamping.cantidadHuespedesAdicionales,
                          h + 1
                        )
                      )
                    }
                    className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-50"
                  >
                    +
                  </button>
                  <span className="text-xs text-stone-400">
                    (máx {glamping.cantidadHuespedes + glamping.cantidadHuespedesAdicionales})
                  </span>
                </div>
              </div>

              {/* Cotización */}
              {loadingCotizacion && (
                <div className="text-center py-3 text-sm text-stone-400">Calculando...</div>
              )}
              {cotizacion && !loadingCotizacion && (
                <div className="bg-stone-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Alojamiento ({noches} {noches === 1 ? 'noche' : 'noches'})</span>
                    <span>{formatCOP(cotizacion.subtotalAlojamiento)}</span>
                  </div>
                  {cotizacion.subtotalExtras > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>Extras</span>
                      <span>{formatCOP(cotizacion.subtotalExtras)}</span>
                    </div>
                  )}
                  <hr className="border-stone-200" />
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>Total</span>
                    <span>{formatCOP(cotizacion.precioTotal)}</span>
                  </div>
                  {!cotizacion.disponible && (
                    <p className="text-red-500 text-xs font-medium">
                      No disponible en esas fechas
                    </p>
                  )}
                </div>
              )}

              <Button
                fullWidth
                size="lg"
                onClick={handleReservar}
                disabled={!!(cotizacion && !cotizacion.disponible)}
              >
                Reservar ahora
              </Button>

              <p className="text-center text-xs text-stone-400 mt-3">
                No se cobra nada hasta confirmar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra fija inferior — solo móvil */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between gap-4">
        <div>
          {cotizacion ? (
            <>
              <p className="text-xs text-stone-400">Total estimado</p>
              <p className="text-lg font-bold text-stone-900">{formatCOP(cotizacion.precioTotal)}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-400">Desde</p>
              <p className="text-lg font-bold text-stone-900">
                {formatCOP(glamping.precioNoche * 1.15)}
                <span className="text-xs font-normal text-stone-400"> / noche</span>
              </p>
            </>
          )}
        </div>
        <Button onClick={handleReservar} size="lg" className="shrink-0">
          Reservar
        </Button>
      </div>
    </div>
  )
}
