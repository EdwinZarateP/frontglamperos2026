'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { tipoGlampingLabels, calcularComision, formatCOP } from '@/lib/utils'

const PLACEHOLDER_IMAGE = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'

export interface CarouselGlamping {
  id: string
  nombre: string
  tipo: string
  ciudad: string
  imagen: string
  precio: number
}

interface Props {
  glampings: CarouselGlamping[]
}

export function CategoriasCarouselClient({ glampings }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(5)
  const touchStartRef = useRef<number>(0)
  const touchEndRef = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.targetTouches[0].clientX }
  const handleTouchMove  = (e: React.TouchEvent) => { touchEndRef.current  = e.targetTouches[0].clientX }
  const handleTouchEnd   = () => {
    const dist = touchStartRef.current - touchEndRef.current
    if (dist > 50) nextSlide()
    else if (dist < -50) prevSlide()
  }

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      if (w >= 1280) setItemsPerView(5)
      else if (w >= 1024) setItemsPerView(4)
      else if (w >= 768) setItemsPerView(2)
      else setItemsPerView(1)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const maxIndex = Math.max(0, glampings.length - itemsPerView)
  const nextSlide = () => setCurrentIndex((p) => p >= maxIndex ? 0 : p + 1)
  const prevSlide = () => setCurrentIndex((p) => p === 0 ? maxIndex : p - 1)

  if (!glampings.length) return null

  const widthClass = itemsPerView === 5 ? 'w-1/5' : itemsPerView === 4 ? 'w-1/4' : itemsPerView === 2 ? 'w-1/2' : 'w-full'

  return (
    <section className="mt-20 mb-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
          Los 10 glampings más buscados en Colombia
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={prevSlide}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Anterior"
        >
          <ChevronLeft size={20} className="text-stone-700" />
        </button>

        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
          >
            {glampings.map((g) => (
              <div key={g.id} className={`flex-shrink-0 ${widthClass} px-1.5`}>
                <Link href={`/glamping/${g.id}`}>
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer aspect-square">
                    <img
                      src={g.imagen || PLACEHOLDER_IMAGE}
                      alt={g.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-sm font-bold text-white truncate drop-shadow">{g.nombre}</h4>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <p className="text-xs text-white/80 capitalize truncate">{tipoGlampingLabels[g.tipo] ?? g.tipo} · {g.ciudad.split(',')[0]}</p>
                        {g.precio > 0 && (
                          <p className="text-xs font-bold text-white whitespace-nowrap drop-shadow">
                            {formatCOP(calcularComision(g.precio))}/noche
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Siguiente"
        >
          <ChevronRight size={20} className="text-stone-700" />
        </button>

        <div className="flex justify-center gap-2 mt-5">
          {glampings.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-brand' : 'bg-stone-300'}`}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
