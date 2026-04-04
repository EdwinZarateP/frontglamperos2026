'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const CATEGORIAS = [
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  },
  {
    tipo: 'CHALET',
    subtitle: 'Un espacio íntimo para descansar y reconectar',
    description: 'Chalets listos para tu escapada.'
  },
  {
    tipo: 'DOMO',
    subtitle: 'Aventura y libertad en un mismo destino',
    description: 'Descubre el encanto de un domo'
  },
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  },
  {
    tipo: 'CHALET',
    subtitle: 'Un espacio íntimo para descansar y reconectar',
    description: 'Chalets listos para tu escapada.'
  },
  {
    tipo: 'DOMO',
    subtitle: 'Aventura y libertad en un mismo destino',
    description: 'Descubre el encanto de un domo'
  },
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  },
  {
    tipo: 'CHALET',
    subtitle: 'Un espacio íntimo para descansar y reconectar',
    description: 'Chalets listos para tu escapada.'
  },
  {
    tipo: 'DOMO',
    subtitle: 'Aventura y libertad en un mismo destino',
    description: 'Descubre el encanto de un domo'
  },
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  }
]

const PLACEHOLDER_IMAGE = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'

interface Props {
  glampingImage?: string
}

export function CategoriasCarouselClient({ glampingImage }: Props) {
  const imageUrl = glampingImage || PLACEHOLDER_IMAGE
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)
  const touchStartRef = useRef<number>(0)
  const touchEndRef = useRef<number>(0)

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    const touchDistance = touchStartRef.current - touchEndRef.current
    const minSwipeDistance = 50 // Mínimo 50px para considerar swipe

    if (touchDistance > minSwipeDistance) {
      // Swipe izquierda -> siguiente
      nextSlide()
    } else if (touchDistance < -minSwipeDistance) {
      // Swipe derecha -> anterior
      prevSlide()
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setItemsPerView(window.innerWidth >= 1024 ? 3 : 1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, CATEGORIAS.length - itemsPerView)
      return prev >= maxIndex ? 0 : prev + 1
    })
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, CATEGORIAS.length - itemsPerView)
      return prev === 0 ? maxIndex : prev - 1
    })
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <section className="mt-20 mb-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
          Los 10 glampings más buscados en Colombia
        </h2>
      </div>

      <div className="relative">
        {/* Flecha izquierda — solo desktop, dentro del boundary */}
        <button
          onClick={prevSlide}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Anterior"
        >
          <ChevronLeft size={22} className="text-stone-700" />
        </button>

        {/* Carrusel */}
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
            {CATEGORIAS.map((categoria, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-2"
              >
                <Link href="/glamping/69b8b1a4776b87a18af6b6f8">
                  <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                    {/* Imagen de fondo */}
                    <img
                      src={imageUrl}
                      alt={categoria.tipo}
                      className="w-full h-80 object-cover"
                    />
                    
                    {/* Overlay oscuro */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Contenido centrado */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                        {categoria.tipo}
                      </h3>
                      <p className="text-white/90 text-sm md:text-base mb-4 drop-shadow">
                        {categoria.subtitle}
                      </p>
                    </div>
                    
                    {/* Parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-stone-200">
                      <h4 className="text-lg font-bold text-stone-900 mb-1">
                        {categoria.tipo}
                      </h4>
                      <p className="text-sm text-stone-600">
                        {categoria.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Flecha derecha — solo desktop, dentro del boundary */}
        <button
          onClick={nextSlide}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Siguiente"
        >
          <ChevronRight size={22} className="text-stone-700" />
        </button>

        {/* Indicadores (dots) */}
        <div className="flex justify-center gap-2 mt-6">
          {CATEGORIAS.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-6 bg-brand' : 'bg-stone-300'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}