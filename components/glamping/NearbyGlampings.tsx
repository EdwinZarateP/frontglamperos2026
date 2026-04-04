'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useGlampingsHome } from '@/hooks/useGlampings'
import { GlampingCard } from '@/components/glamping/GlampingCard'

interface Props {
  currentId: string
  lat?: number
  lng?: number
  ciudad: string
}

export function NearbyGlampings({ currentId, lat, lng, ciudad }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const hasCoords = lat != null && lng != null

  const { data, isLoading } = useGlampingsHome(
    hasCoords
      ? { lat, lng, limit: 11, order_by: 'distancia', radio_km: 200 }
      : { ciudad: ciudad.split(',')[0].trim(), limit: 11, order_by: 'calificacion' }
  )

  const glampings = (data?.data ?? [])
    .filter((g) => g.id !== currentId)
    .slice(0, 10)

  if (isLoading || glampings.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  const ciudadLabel = ciudad.split(',')[0].trim()

  return (
    <section className="mt-10 mb-6">
      <h2 className="text-xl font-bold text-stone-900 mb-5">
        Más glampings cerca a {ciudadLabel}
      </h2>

      <div className="relative group">
        {/* Flecha izquierda */}
        <button
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="absolute left-0 top-1/2 -translate-y-8 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200 items-center justify-center hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={20} className="text-stone-700" />
        </button>

        {/* Carrusel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {glampings.map((g) => (
            <div key={g.id} className="flex-none w-64 sm:w-72">
              <GlampingCard glamping={g} />
            </div>
          ))}
        </div>

        {/* Flecha derecha */}
        <button
          onClick={() => scroll('right')}
          aria-label="Siguiente"
          className="absolute right-0 top-1/2 -translate-y-8 translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200 items-center justify-center hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={20} className="text-stone-700" />
        </button>
      </div>
    </section>
  )
}
