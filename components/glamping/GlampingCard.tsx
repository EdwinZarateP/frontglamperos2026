'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { FaPaw } from 'react-icons/fa'
import { AiTwotoneHeart } from 'react-icons/ai'
import { BsBalloonHeartFill } from 'react-icons/bs'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP, tipoGlampingLabels, placeholderImg } from '@/lib/utils'
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

  // Amenidades destacadas que se mencionan en el título
  const AMENIDADES_TITULO: Record<string, string> = {
    'jacuzzi':          'Jacuzzi',
    'piscina':          'Piscina',
    'malla-catamaran':  'Malla Catamarán',
    'tina':             'Tina',
    'vista-al-lago':    'Vista al Lago',
  }
  const amenidadDestacada = glamping.amenidades?.find((a) => AMENIDADES_TITULO[a])
  const tituloTipo = tipoGlampingLabels[glamping.tipo] ?? glamping.tipo
  const titulo = amenidadDestacada
    ? `${tituloTipo} con ${AMENIDADES_TITULO[amenidadDestacada]}`
    : tituloTipo

  // Ciudad - Departamento con guión
  const [ciudad, departamento] = glamping.ciudadDepartamento.split(',').map((s) => s.trim())
  const ciudadLabel = departamento ? `${ciudad} - ${departamento}` : ciudad

  const incluyeDesayuno = glamping.amenidades?.includes('incluye-desayuno')

  return (
    <article className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg border border-stone-100 transition-all duration-300 flex flex-col h-full">
      {/* Carrusel cuadrado */}
      <div
        className="relative aspect-square overflow-hidden"
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
                  src={imgError ? placeholderImg(600, 600) : src}
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

        {/* Huella — inferior izquierda, solo si acepta mascotas */}
        {glamping.aceptaMascotas && (
          <FaPaw size={26} className="absolute bottom-2 left-2 text-white drop-shadow" />
        )}

        {/* Badge desayuno — inferior derecha sobre la imagen */}
        {incluyeDesayuno && (
          <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm leading-none">
            Incluye desayuno
          </div>
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
          className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
          aria-label={glamping.esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          {glamping.esFavorito
            ? <BsBalloonHeartFill size={26} className="text-red-500" />
            : <AiTwotoneHeart size={26} className="text-stone-400" />
          }
        </button>
      </div>

      {/* Contenido */}
      <Link href={`/glamping/${glamping.id}`} className="flex flex-col flex-1 p-4">
        {/* Tipo + amenidad destacada | Calificación */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-stone-900 text-sm leading-tight line-clamp-1">
            {titulo}
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

        {/* Ciudad - Departamento */}
        <p className="text-xs text-stone-500 mt-1 truncate">{ciudadLabel}</p>

        {/* Precio más alto (sábado) — noche para 2 */}
        <div className="mt-auto pt-3">
          <p className="font-bold text-stone-900 text-base leading-tight">
            {formatCOP(glamping.precioSabado)}
            <span className="text-xs font-normal text-stone-400"> / noche para 2</span>
          </p>
        </div>
      </Link>
    </article>
  )
}
