'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Heart, Star, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP, amenidadIconos, tipoGlampingLabels, placeholderImg } from '@/lib/utils'
import type { GlampingCard as GlampingCardType } from '@/types'

interface Props {
  glamping: GlampingCardType
}

export function GlampingCard({ glamping }: Props) {
  const [imgError, setImgError] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)
  const { isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  const toggleFavorito = useMutation({
    mutationFn: async () => {
      if (glamping.esFavorito) {
        await api.delete(`/usuarios/me/favoritos/${glamping.id}`)
      } else {
        await api.post('/usuarios/me/favoritos', { glampingId: glamping.id })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glampings-home'] })
      queryClient.invalidateQueries({ queryKey: ['favoritos'] })
      toast.success(glamping.esFavorito ? 'Eliminado de favoritos' : 'Guardado en favoritos')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const imagenes = glamping.imagenes?.length ? glamping.imagenes : [placeholderImg(600, 400)]
  const total = imagenes.length

  const touchStartX = useRef(0)
  const swipeOccurred = useRef(false)

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImg((i) => Math.max(0, i - 1))
  }

  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentImg((i) => Math.min(total - 1, i + 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    swipeOccurred.current = false
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      swipeOccurred.current = true
      if (delta > 0) setCurrentImg((i) => Math.min(total - 1, i + 1))
      else setCurrentImg((i) => Math.max(0, i - 1))
    }
  }

  // Puntos — máx 3, el activo cambia con cada imagen
  const MAX_DOTS = 3
  const dots = Math.min(total, MAX_DOTS)
  const activeDot = currentImg % MAX_DOTS

  return (
    <article className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-stone-100 transition-all duration-300 flex flex-col h-full">
      {/* Carrusel con deslizamiento real */}
      <div
        className="relative aspect-video overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Tira de imágenes — se desplaza con translateX */}
        <Link
          href={`/glamping/${glamping.id}`}
          className="block w-full h-full"
          onClick={(e) => { if (swipeOccurred.current) e.preventDefault() }}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentImg * (100 / total)}%)`, width: `${total * 100}%` }}
          >
            {imagenes.map((src, i) => (
              <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
                <img
                  src={imgError ? placeholderImg(600, 400) : src}
                  alt={`${glamping.nombreSeo} ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        </Link>

        {/* Flechas — solo si hay más de 1 foto */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              disabled={currentImg === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={16} className="text-stone-700" />
            </button>
            <button
              onClick={next}
              disabled={currentImg === total - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={16} className="text-stone-700" />
            </button>

            {/* Puntos — máx 3, cambian con cada imagen */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {Array.from({ length: dots }).map((_, d) => (
                <div
                  key={d}
                  className={`h-1.5 rounded-full transition-all duration-300 ${d === activeDot ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Botón favorito — siempre visible */}
        <button
          onClick={(e) => {
            e.preventDefault()
            if (!isAuthenticated) {
              toast.error('Inicia sesión para guardar en favoritos')
              return
            }
            toggleFavorito.mutate()
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:scale-110 transition-transform"
          aria-label={glamping.esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart size={16} className={glamping.esFavorito ? 'fill-red-500 text-red-500' : 'text-stone-400'} />
        </button>
      </div>

      {/* Contenido */}
      <Link href={`/glamping/${glamping.id}`} className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900 text-sm leading-tight line-clamp-1">
            {tipoGlampingLabels[glamping.tipo] ?? glamping.tipo} en{' '}
            {glamping.ciudadDepartamento.split(',')[0].trim()}
          </h3>
          {glamping.calificacion > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-stone-700">
                {glamping.calificacion.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 text-stone-500">
          <MapPin size={12} />
          <span className="text-xs truncate">{glamping.ciudadDepartamento}</span>
          {glamping.distanciaKm && (
            <span className="text-xs text-stone-400 ml-auto shrink-0">
              {glamping.distanciaKm < 1
                ? `${(glamping.distanciaKm * 1000).toFixed(0)}m`
                : `${glamping.distanciaKm.toFixed(0)}km`}
            </span>
          )}
        </div>

        {/* Amenidades */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {glamping.amenidades?.slice(0, 4).map((a) => (
            <span key={a} className="text-base" title={a}>
              {amenidadIconos[a] || '✓'}
            </span>
          ))}
          {glamping.aceptaMascotas && <span className="text-base" title="Acepta mascotas">🐾</span>}
        </div>

        {/* Precio base + desayuno */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-stone-400">Desde</p>
            <p className="font-bold text-stone-900 text-base">
              {formatCOP(glamping.precioSabado)}
              <span className="text-xs font-normal text-stone-400"> / noche</span>
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
            glamping.amenidades?.includes('incluye-desayuno')
              ? 'bg-emerald-50 text-brand-light'
              : 'bg-stone-100 text-stone-400'
          }`}>
            {glamping.amenidades?.includes('incluye-desayuno') ? '☕ Con desayuno' : 'Sin desayuno'}
          </span>
        </div>
      </Link>
    </article>
  )
}
