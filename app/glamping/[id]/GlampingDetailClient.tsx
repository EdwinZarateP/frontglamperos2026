'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MapPin, Users, Dog, Clock, ChevronLeft, Calendar,
  Heart, Share2, CheckCircle, Youtube, Play, X, Copy,
  Plus, XCircle
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useCalificaciones, useCotizacion, useFechasBloqueadas } from '@/hooks/useGlampings'
import { Button } from '@/components/ui/Button'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { formatCOP, formatDate, amenidadIconos, calcularNoches, tipoGlampingLabels, calcularComision, colombianHolidays } from '@/lib/utils'
import { NearbyGlampings } from '@/components/glamping/NearbyGlampings'
import type { Glamping } from '@/types'
// Orden de los extras en la página pública — juegoMenteCriminal siempre primero
const PUBLIC_EXTRAS_ORDER = [
  'juegoMenteCriminal',
  'cabalgata', 'jacuzzi', 'masajes', 'masaje', 'desayuno', 'almuerzo',
  'cenaEstandar', 'cenaRomantica', 'decoracionSencilla', 'decoracionEspecial',
  'picnic', 'pelicula', 'paseoLancha', 'paseoBicicleta', 'caminataGuiada',
  'cuatrimoto', 'parapente', 'paseoKayak', 'paseoVela', 'paseoJetSki',
  'tour1', 'tour2', 'tour3', 'descorche', 'kitFogata',
]
function sortExtras<T extends { key: string }>(extras: T[]): T[] {
  return [...extras].sort((a, b) => {
    const ia = PUBLIC_EXTRAS_ORDER.indexOf(a.key)
    const ib = PUBLIC_EXTRAS_ORDER.indexOf(b.key)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}
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
  const [huespedes, setHuespedes] = useState(2)
  const [cantidadMascotas, setCantidadMascotas] = useState(0)
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<string[]>([])
  const [showAllAmenidades, setShowAllAmenidades] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (showReservationModal || showCalendar || showVideo) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [showReservationModal, showCalendar, showVideo])

  const { data: calificaciones } = useCalificaciones(glamping._id)
  const { data: fechasBloqueadas = [] } = useFechasBloqueadas(glamping._id)
  const _now = new Date()
  const festivosSet = new Set([
    ...colombianHolidays(_now.getFullYear()),
    ...colombianHolidays(_now.getFullYear() + 1),
  ])
  
  const extrasParam = extrasSeleccionados.length > 0 ? extrasSeleccionados.join(',') : undefined
  
  const { data: cotizacion, isLoading: loadingCotizacion } = useCotizacion(glamping._id, {
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    huespedes,
    extras: extrasParam,
  })

  const noches = fechaInicio && fechaFin ? calcularNoches(fechaInicio, fechaFin) : 0
  const imagenes = glamping.imagenes?.length
    ? glamping.imagenes
    : ['https://placehold.co/1200x800/1a1a1a/ffffff?text=Sin+imagen']

  const getDiaSemana = (fecha: string): string => {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
    const date = new Date(fecha + 'T00:00:00')
    return dias[date.getDay()]
  }

  const getPrecioPorNoche = (fecha: string): number => {
    if (!glamping.tarifasNoche) {
      return glamping.precioNoche
    }
    
    const dia = getDiaSemana(fecha)
    const precioDia = (glamping.tarifasNoche as Record<string, number>)[dia]
    
    if (precioDia && precioDia > 0) {
      return precioDia
    }
    
    const preciosValidos = Object.values(glamping.tarifasNoche).filter((p: any) => p > 0) as number[]
    if (preciosValidos.length > 0) {
      return Math.min(...preciosValidos)
    }
    
    return glamping.precioNoche
  }

  const precioBaseDinamico = (() => {
    if (glamping.tarifasNoche) {
      const precios = Object.values(glamping.tarifasNoche).filter((p: any) => p > 0) as number[]
      if (precios.length > 0) {
        const precioMaximo = Math.max(...precios)
        return precioMaximo
      }
    }
    
    if (fechaInicio) {
      return getPrecioPorNoche(fechaInicio)
    }
    
    return glamping.precioNoche
  })()

  // Subtotal de extras — funciona sin fechas (usa noches || 1 para extras por_noche)
  const calcularSubtotalExtras = (nochesRef = noches) => {
    return extrasSeleccionados.reduce((total, key) => {
      const extra = glamping.extras?.find(e => e.key === key)
      if (!extra) return total
      const nochesEfectivas = nochesRef > 0 ? nochesRef : 1
      const cantidad = extra.unidad === 'por_noche' ? nochesEfectivas
                     : extra.unidad === 'por_persona' ? huespedes
                     : 1
      return total + (extra.precioPublico * cantidad)
    }, 0)
  }

  const subtotalExtrasActual = calcularSubtotalExtras()

  const calcularTotalLocal = () => {
    const subtotalExtras = calcularSubtotalExtras()
    if (!fechaInicio || !fechaFin) return { subtotalAlojamiento: 0, subtotalExtras, precioTotal: subtotalExtras }

    let subtotalAlojamiento = 0
    const fechaActual = new Date(fechaInicio + 'T00:00:00')
    for (let i = 0; i < noches; i++) {
      const fechaIteracion = new Date(fechaActual)
      fechaIteracion.setDate(fechaIteracion.getDate() + i)
      const fechaStr = fechaIteracion.toISOString().split('T')[0]
      subtotalAlojamiento += calcularComision(getPrecioPorNoche(fechaStr))
    }

    return {
      subtotalAlojamiento,
      subtotalExtras,
      precioTotal: subtotalAlojamiento + subtotalExtras,
    }
  }

  const cotizacionDisplay = (() => {
    if (cotizacion && cotizacion.total && cotizacion.total > 0) {
      return { ...cotizacion, precioTotal: cotizacion.total }
    }
    
    return calcularTotalLocal()
  })()

  const disponible = true

  const adicionales = Math.max(0, huespedes - glamping.cantidadHuespedes)
  const precioAdicional = (() => {
    if (adicionales <= 0 || noches <= 0) return 0
    const precioAdic = glamping.precioPersonaAdicional ?? 0
    // Para adicionales usamos directamente 1.16 (16% de comisión)
    // No aplicamos la escala progresiva ya que es un adicional
    const factor = 1.16
    return Math.round(precioAdic * adicionales * factor * noches)
  })()
  const precioMascota = cantidadMascotas > 0 && noches > 0
    ? Math.round((glamping.precioMascotas ?? 0) * cantidadMascotas * noches * 1.10)
    : 0
  const totalFinal = (cotizacionDisplay?.precioTotal ?? 0) + precioAdicional + precioMascota
  
  // Calcular el precio por noche dinámico basado en todo lo seleccionado
  const precioPorNocheDinamico = noches > 0 && fechaInicio && fechaFin
    ? Math.round(totalFinal / noches)
    : Math.round(calcularComision(precioBaseDinamico))

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
      const reservarParams = new URLSearchParams()
      if (fechaInicio) reservarParams.set('fechaInicio', fechaInicio)
      if (fechaFin) reservarParams.set('fechaFin', fechaFin)
      reservarParams.set('huespedes', String(huespedes))
      if (cantidadMascotas > 0) reservarParams.set('mascotas', String(cantidadMascotas))
      if (extrasSeleccionados.length > 0) reservarParams.set('extras', extrasSeleccionados.join(','))
      const qs = reservarParams.toString()
      const destino = `/glamping/${glamping._id}/reservar${qs ? `?${qs}` : ''}`
      router.push(`/auth/login?redirect=${encodeURIComponent(destino)}`)
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
      mascotas: String(cantidadMascotas),
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
    const comision = (p: number) => formatCOP(Math.round(calcularComision(p)))
    const lines: string[] = []

    lines.push(`🏕️ *${tipo} en ${glamping.ciudadDepartamento.split(',')[0].trim()}*`)
    lines.push(`📍 ${glamping.ciudadDepartamento}`)
    lines.push('')

    lines.push(glamping.descripcionGlamping)
    lines.push('')

    const t = glamping.tarifasNoche
    const diasLabels: [string, string][] = [
      ['lunes','Lunes'],['martes','Martes'],['miercoles','Miércoles'],
      ['jueves','Jueves'],['viernes','Viernes'],['sabado','Sábado'],['domingo','Domingo'],
    ]
    const tieneVariacion = t && diasLabels.some(([k]) => (t as Record<string,number>)[k] > 0)
    if (tieneVariacion && t) {
      lines.push('💰 *Precios por noche:*')
      for (const [key, label] of diasLabels) {
        const p = (t as Record<string,number>)[key] || glamping.precioNoche
        lines.push(`• ${label}: ${comision(p)}`)
      }
      lines.push('📅 _Los dias previos a festivos tienen tarifa de sábado_')
    } else {
      lines.push(`💰 *Precio por noche:* ${comision(glamping.precioNoche)}`)
    }
    lines.push('')

    lines.push(`🕐 Check-in: ${glamping.checkInNoche} | Check-out: ${glamping.checkOutNoche}`)
    if (glamping.cantidadHuespedes) {
      let capLine = `👥 Precio base INCLUYE ${glamping.cantidadHuespedes} ${glamping.cantidadHuespedes === 1 ? 'persona' : 'personas'}`
      if (glamping.cantidadHuespedesAdicionales) capLine += ` · hasta ${glamping.cantidadHuespedesAdicionales} adicionales con cargo extra`
      lines.push(capLine)
    }
    if (glamping.precioPersonaAdicional) {
      lines.push(`➕ Cargo por persona adicional (sobre las ${glamping.cantidadHuespedes} incluidas): ${comision(glamping.precioPersonaAdicional)}/noche`)
    }
    if (glamping.aceptaMascotas) {
      let mascotaLine = '🐾 Acepta mascotas'
      if (glamping.precioMascotas) mascotaLine += ` · cargo: ${comision(glamping.precioMascotas)}/mascota/noche`
      lines.push(mascotaLine)
    }
    lines.push('')

    const extrasDisponibles = glamping.extras?.filter((e) => e.disponible) ?? []
    if (extrasDisponibles.length > 0) {
      lines.push('➕ *Extras disponibles (con costo adicional):*')
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
    lines.push('')

    const base = typeof window !== 'undefined' ? window.location.origin : 'https://glamperos.com'
    lines.push(`📸 *Ver collage de fotos:*\n${base}/glamping/${glamping._id}/fotos`)

    if (glamping.videoYoutube) {
      lines.push('')
      lines.push(`🎥 *Ver video:*\n${glamping.videoYoutube}`)
    }

    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('💌 *Proceso de reserva*')
    lines.push('Las reservas se garantizan con una transferencia del 50% del valor total 💳 para asegurar tu fecha.')
    lines.push('La plataforma te envía al correo toda la información de llegada y contactos posterior a confirmar tu consignación.')
    lines.push('_Ten en cuenta que este valor no es reembolsable. El 50% restante se cancela a tu llegada al glamping 🏕️._')
    lines.push('')
    lines.push('*Datos de pago:*')
    lines.push('🏦 Cuenta Bancolombia – Glamperos SAS')
    lines.push('📂 Tipo: Ahorros')
    lines.push('🔢 Nº 292-000059-43')
    lines.push('📂 Nuestra Llave')
    lines.push('🔢 0089996468')
    lines.push('')
    lines.push('_Glamperos S.A.S. actúa únicamente en la promoción y reserva de experiencias ofrecidas por terceros y no asume responsabilidad por la calidad, seguridad o disponibilidad de dichos servicios._')

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

  const extrasSeleccionadosInfo = extrasSeleccionados.map(key => {
    return glamping.extras?.find(e => e.key === key)
  }).filter(Boolean)

  // Formato de fecha para el modal (sin año si es el mismo)
  const formatFechaCompacta = (fecha: string): string => {
    if (!fecha) return ''
    const date = new Date(fecha + 'T00:00:00')
    const dia = date.getDate()
    const mes = date.toLocaleDateString('es-ES', { month: 'short' })
    const anio = date.getFullYear()
    const anioActual = new Date().getFullYear()
    return anio === anioActual ? `${dia} ${mes}` : `${dia} ${mes} ${anio}`
  }

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-0 sm:pt-6 pb-1 flex flex-col">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-400 mb-4 order-2 lg:order-1 px-0 pt-3 lg:pt-0">
        <Link href="/" className="hover:text-stone-700 flex items-center gap-1">
          <ChevronLeft size={14} /> Inicio
        </Link>
        <span>/</span>
        <span className="text-stone-800 font-medium truncate">
          {tipoGlampingLabels[glamping.tipoGlamping] ?? glamping.tipoGlamping} en {glamping.ciudadDepartamento.split(',')[0].trim()}
        </span>
      </nav>

      {/* Título */}
      <div className={`flex items-start justify-between gap-4 mb-4 order-3 lg:order-2 ${showReservationModal ? 'z-0' : 'z-auto'}`}>
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
          </div>
        </div>
        <div className={`flex items-center gap-2 shrink-0 ${showReservationModal ? 'hidden z-0' : 'flex z-10'}`}>
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
      <div className="mb-4 lg:mb-8 order-1 lg:order-3">
        {/* Móvil: imagen principal con indicador */}
        <div
          className="sm:hidden relative overflow-hidden aspect-[4/3] bg-stone-100 -mx-4"
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
          {glamping.aceptaMascotas && (
            <span className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow text-base">
              🐾
            </span>
          )}
          {glamping.videoYoutube && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowVideo(true) }}
              className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition-colors"
            >
              <Play size={12} fill="white" /> Ver video
            </button>
          )}
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
            {glamping.aceptaMascotas && (
              <span className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow text-lg">
                🐾
              </span>
            )}
            {glamping.videoYoutube && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowVideo(true) }}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/80 transition-colors"
              >
                <Play size={12} fill="white" /> Ver video
              </button>
            )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 order-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info básica */}
          <div className="flex flex-wrap gap-5 pb-8 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-600">
              <Users size={20} className="text-brand" />
              <span className="text-sm">
                Hasta <strong>{glamping.cantidadHuespedes}</strong> huéspedes
                {glamping.cantidadHuespedesAdicionales > 0 &&
                  ` (+${glamping.cantidadHuespedesAdicionales} adicionales)`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Clock size={20} className="text-brand" />
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

          {/* Extras */}
          {glamping.extras?.filter((e) => e.disponible).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-900 mb-1">Servicios extras</h2>
              <p className="text-xs text-stone-400 mb-4">Con costo adicional</p>
              <div className="space-y-3">
                {sortExtras(glamping.extras
                  .filter((e) => e.disponible))
                  .map((extra) => {
                    const selected = extrasSeleccionados.includes(extra.key)
                    return (
                      <motion.div
                        key={extra.key}
                        onClick={() => toggleExtra(extra.key)}
                        initial={{ scale: 1 }}
                        whileTap={{ scale: 0.98 }}
                        animate={{ 
                          scale:1,
                          borderColor: selected ? '#059669' : '#e7e5e4'
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selected
                            ? 'border-brand bg-emerald-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: selected ? 1 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected ? 'border-brand bg-brand' : 'border-stone-300'
                            }`}
                          >
                            {selected && <CheckCircle size={12} className="text-white" />}
                          </motion.div>
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
                      </motion.div>
                    )
                  })}
              </div>
            </div>
          )}

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
                  className="mt-3 text-sm font-medium text-stone-700 underline hover:text-brand"
                >
                  {showAllAmenidades
                    ? 'Ver menos'
                    : `Ver todas las ${glamping.amenidades.length} amenidades`}
                </button>
              )}
            </div>
          )}

          {/* Pasadía */}
          {glamping.permitePasadia && (() => {
            const tp = glamping.tarifasPasadia as Record<string,number> | undefined
            const baseEntreSmana = tp?.lunes || tp?.martes || 0
            const precioEntreSmana = baseEntreSmana > 0 ? Math.round(calcularComision(baseEntreSmana)) : null
            const baseFinDeSemana = tp?.sabado || glamping.precioNoche as number | undefined
            const precioFinDeSemana = baseFinDeSemana ? Math.round(calcularComision(baseFinDeSemana)) : undefined
            return (
              <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-amber-800">Acepta pasadía</h3>
                    {(glamping.pasadiaHorarioInicio || glamping.pasadiaHorarioFin) && (
                      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                        {glamping.pasadiaHorarioInicio} – {glamping.pasadiaHorarioFin}
                      </span>
                    )}
                  </div>
                  {glamping.descripcionPasadia && (
                    <p className="text-sm text-amber-700">{glamping.descripcionPasadia}</p>
                  )}
                  <button
                    onClick={() => {
                      const destino = `/glamping/${glamping._id}/reservar?tipo=PASADIA`
                      if (!isAuthenticated) {
                        router.push(`/auth/login?redirect=${encodeURIComponent(destino)}`)
                      } else {
                        router.push(destino)
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Reservar pasadía
                  </button>
                </div>
                <div className="border-t border-amber-200 px-4 py-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-amber-600 font-medium mb-0.5">Entre semana</p>
                    <p className="text-[10px] text-amber-500 mb-1">Lu – Vi (sin festivos)</p>
                    <p className="font-semibold text-amber-900">
                      {precioEntreSmana ? formatCOP(precioEntreSmana) : 'Consultar'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 font-medium mb-0.5">Fin de semana</p>
                    <p className="text-[10px] text-amber-500 mb-1">Sá – Do y festivos</p>
                    <p className="font-semibold text-amber-900">
                      {precioFinDeSemana ? formatCOP(precioFinDeSemana) : 'Consultar'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

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


          {/* Proceso de reserva */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 space-y-4">
            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              💌 Proceso de reserva
            </h2>
            <p className="text-sm text-stone-700 leading-relaxed">
              Las reservas se garantizan con una transferencia del <strong>50% del valor total</strong> 💳 para asegurar tu fecha.
              La plataforma te envía al correo toda la información de llegada y contactos posterior a confirmar tu consignación.
            </p>
            <p className="text-xs text-stone-500 italic">
              Ten en cuenta que este valor no es reembolsable. El 50% restante se cancela a tu llegada al glamping 🏕️.
            </p>

            <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-1.5">
              <p className="text-sm font-semibold text-stone-800">Datos de pago:</p>
              <p className="text-sm text-stone-700">🏦 Cuenta Bancolombia – Glamperos SAS</p>
              <p className="text-sm text-stone-700">📂 Tipo: Ahorros &nbsp;·&nbsp; 🔢 Nº 292-000059-43</p>
              <p className="text-sm text-stone-700">📂 Nuestra Llave &nbsp;·&nbsp; 🔢 0089996468</p>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed italic">
              Glamperos S.A.S. actúa únicamente en la promoción y reserva de experiencias ofrecidas por terceros y no asume responsabilidad por la calidad, seguridad o disponibilidad de dichos servicios.
            </p>
          </div>

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
                <span className="text-xs text-stone-400">{noches > 0 && fechaInicio && fechaFin ? 'Por noche' : 'Desde'}</span>
                <p className="text-2xl font-bold text-stone-900">
                  {formatCOP(precioPorNocheDinamico)}
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

              {/* Fechas — botón que abre el calendario popup */}
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm text-left hover:border-emerald-400 transition-colors mb-3"
              >
                {fechaInicio && fechaFin ? (
                  <span className="font-medium text-stone-800">
                    {formatDate(fechaInicio)} → {formatDate(fechaFin)}
                    <span className="text-stone-400 font-normal ml-1">
                      · {noches} {noches === 1 ? 'noche' : 'noches'}
                    </span>
                  </span>
                ) : (
                  <span className="text-stone-400">Seleccionar fechas</span>
                )}
              </button>

              {/* Resumen rápido */}
              {(fechaInicio && fechaFin) || extrasSeleccionados.length > 0 ? (
                <div className="bg-stone-50 rounded-xl p-3 mb-3 space-y-2 text-sm">
                  {fechaInicio && fechaFin && (
                    <div
                      className="flex justify-between items-center cursor-pointer hover:bg-stone-100 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => setShowReservationModal(true)}
                    >
                      <span className="text-stone-600">Huéspedes</span>
                      <span className="font-medium text-stone-900">{huespedes}</span>
                    </div>
                  )}
                  {fechaInicio && fechaFin && glamping.aceptaMascotas && (
                    <div
                      className="flex justify-between items-center cursor-pointer hover:bg-stone-100 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => setShowReservationModal(true)}
                    >
                      <span className="text-stone-600">Mascotas</span>
                      <span className="font-medium text-stone-900">{cantidadMascotas}</span>
                    </div>
                  )}
                  {extrasSeleccionados.length > 0 && (
                    <div className="space-y-1">
                      {extrasSeleccionados.map(key => {
                        const extra = glamping.extras?.find(e => e.key === key)
                        if (!extra) return null
                        const nochesEfectivas = noches > 0 ? noches : 1
                        const cantidad = extra.unidad === 'por_noche' ? nochesEfectivas
                                       : extra.unidad === 'por_persona' ? huespedes : 1
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-stone-500 truncate max-w-[140px]">+ {extra.nombre}</span>
                            <span className="font-medium text-stone-900 shrink-0">{formatCOP(extra.precioPublico * cantidad)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <hr className="border-stone-200" />
                  <div className="flex justify-between font-bold text-stone-900 text-base">
                    <span>{fechaInicio && fechaFin ? 'Total' : 'Estimado'}</span>
                    <span>{formatCOP(fechaInicio && fechaFin ? totalFinal : precioPorNocheDinamico + subtotalExtrasActual)}</span>
                  </div>
                  {!fechaInicio && (
                    <p className="text-xs text-stone-400">1 noche + extras · ajusta al elegir fechas</p>
                  )}
                </div>
              ) : null}

  <Button
    fullWidth
    size="lg"
    variant={fechaInicio && fechaFin ? 'brand' : 'primary'}
    onClick={() => {
      if (!fechaInicio || !fechaFin) {
        toast.error('Selecciona las fechas')
        return
      }
      setShowReservationModal(true)
    }}
    disabled={!fechaInicio || !fechaFin}
  >
    {fechaInicio && fechaFin ? 'Gestionar reserva' : 'Reservar ahora'}
  </Button>

              <p className="text-center text-xs text-stone-400 mt-3">
                No se cobra nada hasta confirmar
              </p>
            </div>
          </div>
        </div>

        {/* Modal de reserva completo */}
        {showReservationModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowReservationModal(false)}
          >
            <div
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-stone-900 mb-2">Completa tu reserva</h2>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      {fechaInicio && fechaFin ? (
                        <div className="text-sm">
                          <p className="font-medium text-stone-800">
                            {formatFechaCompacta(fechaInicio)} → {formatFechaCompacta(fechaFin)}
                          </p>
                          <p className="text-xs text-stone-500">
                            {noches} {noches === 1 ? 'noche' : 'noches'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-400">Selecciona las fechas</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCalendar(true)}
                      className="flex items-center gap-2 px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-700 hover:border-brand hover:text-brand transition-all shrink-0"
                    >
                      <Calendar size={14} />
                      Cambiar
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors ml-4"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Huéspedes */}
                <div>
                  <label className="text-sm font-medium text-stone-700 mb-2 block">Huéspedes</label>
                  <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Users size={20} className="text-brand sm:hidden" />
                      <Users size={24} className="text-brand hidden sm:block" />
                      <div>
                        <p className="font-medium text-stone-800 text-sm sm:text-base">Huéspedes</p>
                        <p className="text-xs text-stone-500">
                          Máx {glamping.cantidadHuespedes + glamping.cantidadHuespedesAdicionales}
                        </p>
                        {glamping.precioPersonaAdicional && glamping.precioPersonaAdicional > 0 && huespedes > glamping.cantidadHuespedes && (
                          <p className="text-xs text-stone-500">
                            {formatCOP(Math.round(glamping.precioPersonaAdicional * 1.16))} / huésped adicional / noche
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setHuespedes((h) => Math.max(1, h - 1))}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-xl sm:text-2xl font-bold text-stone-900 w-12 sm:w-16 text-center">{huespedes}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setHuespedes((h) =>
                            Math.min(glamping.cantidadHuespedes + glamping.cantidadHuespedesAdicionales, h + 1)
                          )
                        }
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mascotas */}
                {glamping.aceptaMascotas && (
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-2 block">Mascotas</label>
                    <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Dog size={20} className="text-brand sm:hidden" />
                        <Dog size={24} className="text-brand hidden sm:block" />
                        <div>
                          <p className="font-medium text-stone-800 text-sm sm:text-base">Mascotas</p>
                          {glamping.precioMascotas && glamping.precioMascotas > 0 && (
                            <p className="text-xs text-stone-500">{formatCOP(Math.round(glamping.precioMascotas * 1.10))} / mascota / noche</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setCantidadMascotas((v) => Math.max(0, v - 1))}
                          disabled={cantidadMascotas === 0}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-xl sm:text-2xl font-bold text-stone-900 w-12 sm:w-16 text-center">{cantidadMascotas}</span>
                        <button
                          type="button"
                          onClick={() => setCantidadMascotas((v) => Math.min(2, v + 1))}
                          disabled={cantidadMascotas >= 2}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extras */}
                {glamping.extras?.filter((e) => e.disponible).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-stone-700 mb-3 block">Extras (opcionales)</label>
                    <div className="space-y-2">
                      {sortExtras(glamping.extras
                        .filter((e) => e.disponible))
                        .map((extra) => {
                          const selected = extrasSeleccionados.includes(extra.key)
                          return (
                            <button
                              key={extra.key}
                              onClick={() => toggleExtra(extra.key)}
                              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                selected
                                  ? 'border-brand bg-emerald-50'
                                  : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                  selected ? 'border-brand bg-brand' : 'border-stone-300'
                                }`}>
                                  {selected && <CheckCircle size={14} className="text-white" />}
                                </div>
                                <div className="text-left">
                                  <p className="font-medium text-stone-800 text-sm">{extra.nombre}</p>
                                  <p className="text-xs text-stone-500 capitalize">
                                    {extra.unidad.replace(/_/g, ' ')}
                                    {extra.descripcion && ` · ${extra.descripcion}`}
                                  </p>
                                </div>
                              </div>
                              <span className="font-semibold text-stone-700 text-sm">
                                {formatCOP(extra.precioPublico)}
                              </span>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Cotización */}
                {loadingCotizacion && (
                  <div className="text-center py-4 text-sm text-stone-400">Calculando...</div>
                )}
                {cotizacionDisplay && !loadingCotizacion && (
                  <div className="bg-stone-50 rounded-xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Alojamiento ({noches} {noches === 1 ? 'noche' : 'noches'})</span>
                      <span className="font-semibold text-stone-900">{formatCOP(cotizacionDisplay.subtotalAlojamiento)}</span>
                    </div>
                    {(cotizacionDisplay.subtotalExtras || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-stone-600">Extras</span>
                        <span className="font-semibold text-stone-900">{formatCOP(cotizacionDisplay.subtotalExtras)}</span>
                      </div>
                    )}
                    {precioAdicional > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-stone-600">+{adicionales} huésped{adicionales > 1 ? 'es' : ''} adicional{adicionales > 1 ? 'es' : ''} ({noches} {noches === 1 ? 'noche' : 'noches'})</span>
                          <span className="font-semibold text-stone-900">{formatCOP(precioAdicional)}</span>
                        </div>
                        <div className="text-right text-xs text-stone-400">
                          {formatCOP(Math.round(precioAdicional / noches))} / noche
                        </div>
                      </div>
                    )}
                    {precioMascota > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-stone-600">🐾 {cantidadMascotas === 1 ? '1 mascota' : `${cantidadMascotas} mascotas`} ({noches} {noches === 1 ? 'noche' : 'noches'})</span>
                          <span className="font-semibold text-stone-900">{formatCOP(precioMascota)}</span>
                        </div>
                        <div className="text-right text-xs text-stone-400">
                          {formatCOP(Math.round(precioMascota / noches))} / noche
                        </div>
                      </div>
                    )}
                    <hr className="border-stone-200" />
                    <div className="flex justify-between font-bold text-stone-900 text-xl">
                      <span>Total</span>
                      <span>{formatCOP(totalFinal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Total fijo y botón verde */}
              <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-stone-400">Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-stone-900">{formatCOP(totalFinal)}</p>
                  </div>
                  <button
                    onClick={handleReservar}
                    disabled={!disponible}
                    className="flex-1 sm:w-64 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold px-3 sm:px-6 py-2.5 sm:py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    Confirmar reserva
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal calendario */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowCalendar(false)}
        >
          <div
            className="w-full sm:w-auto sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <DateRangePicker
              startDate={fechaInicio}
              endDate={fechaFin}
              blockedDates={fechasBloqueadas}
              holidays={festivosSet}
              minNights={glamping.minimoNoches || 1}
              onChange={(s, e) => {
                setFechaInicio(s)
                setFechaFin(e)
                if (s && e) setShowCalendar(false)
              }}
              onClose={() => setShowCalendar(false)}
            />
          </div>
        </div>
      )}

      {/* Barra fija inferior — solo móvil (simplificado: solo total + botón) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div 
            className="flex-1 cursor-pointer"
            onClick={() => {
              if (!fechaInicio || !fechaFin) {
                toast.error('Selecciona las fechas')
                return
              }
              setShowReservationModal(true)
            }}
          >
            {cotizacionDisplay && fechaInicio && fechaFin ? (
              <>
                <p className="text-xs text-stone-400">Total</p>
                <p className="text-xl font-bold text-stone-900">{formatCOP(totalFinal)}</p>
              </>
            ) : subtotalExtrasActual > 0 ? (
              <>
                <p className="text-xs text-stone-400">Estimado (1 noche + extras)</p>
                <p className="text-xl font-bold text-stone-900">{formatCOP(precioPorNocheDinamico + subtotalExtrasActual)}</p>
                <p className="text-[10px] text-stone-400">ajusta al elegir fechas</p>
              </>
            ) : (
              <>
                <p className="text-xs text-stone-400">Desde</p>
                <p className="text-base font-bold text-stone-900">
                  {formatCOP(precioPorNocheDinamico)}
                  <span className="text-xs font-normal text-stone-400"> / noche</span>
                </p>
              </>
            )}
          </div>
          <Button
            onClick={() => setShowReservationModal(true)}
            size="lg"
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            Reservar
          </Button>
        </div>
      </div>
    </div>

    {/* Glampings cercanos — fuera del contenedor principal para quedar al final */}
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <NearbyGlampings
        currentId={glamping._id}
        lat={glamping.ubicacion?.lat}
        lng={glamping.ubicacion?.lng}
        ciudad={glamping.ciudadDepartamento}
      />
    </section>
    </>
  )
}