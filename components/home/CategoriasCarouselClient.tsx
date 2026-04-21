'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { tipoGlampingLabels } from '@/lib/utils'

const PLACEHOLDER_IMAGE = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'

export interface CarouselGlamping {
  id: string
  nombre: string
  tipo: string
  ciudad: string
  imagen: string
}

interface Props {
  glampings: CarouselGlamping[]
}

export function CategoriasCarouselClient({ glampings }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
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
    const onResize = () => setItemsPerView(window.innerWidth >= 1024 ? 3 : 1)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const maxIndex = Math.max(0, glampings.length - itemsPerView)
  const nextSlide = () => setCurrentIndex((p) => p >= maxIndex ? 0 : p + 1)
  const prevSlide = () => setCurrentIndex((p) => p === 0 ? maxIndex : p - 1)

  if (!glampings.length) return null

  return (
    <section className="mt-20 mb-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
          Los 10 glampings más buscados en Colombia
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={prevSlide}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Anterior"
        >
          <ChevronLeft size={22} className="text-stone-700" />
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
              <div key={g.id} className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-2">
                <Link href={`/glamping/${g.id}`}>
                  <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                    <img
                      src={g.imagen || PLACEHOLDER_IMAGE}
                      alt={g.nombre}
                      className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg capitalize">
                        {tipoGlampingLabels[g.tipo] ?? g.tipo}
                      </h3>
                      <p className="text-white/90 text-sm md:text-base drop-shadow">
                        {g.ciudad}
                      </p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-stone-200">
                      <h4 className="text-base font-bold text-stone-900 truncate">{g.nombre}</h4>
                      <p className="text-sm text-stone-500 capitalize">{tipoGlampingLabels[g.tipo] ?? g.tipo} · {g.ciudad.split(',')[0]}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Siguiente"
        >
          <ChevronRight size={22} className="text-stone-700" />
        </button>

        <div className="flex justify-center gap-2 mt-6">
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
