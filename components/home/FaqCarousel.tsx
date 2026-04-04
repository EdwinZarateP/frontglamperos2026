'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const FAQ_ITEMS = [
  {
    title: '¿Cuánto cuesta un glamping en Colombia?',
    text: 'Un glamping en Colombia es un alojamiento al aire libre con comodidades y contacto con la naturaleza. Ofrece desde opciones básicas hasta experiencias más lujosas. Varía según la ubicación, temporada y servicios incluidos.'
  },
  {
    title: '¿Qué llevar a un glamping?',
    text: 'Lleva ropa cómoda y abrigada, ideal para clima cambiante. Incluye calzado cerrado, artículos de aseo personal y protector solar/repelente. No olvides linterna, cargador portátil y algo ligero para la noche.'
  },
  {
    title: '¿Cuál es la mejor zona para hacer glamping?',
    text: 'Las mejores zonas para glamping en Colombia son las de clima templado y montaña. Destacan el Eje Cafetero y Antioquia por su naturaleza y turismo. Cundinamarca y Boyacá son ideales por su cercanía a Bogotá.'
  },
  {
    title: '¿Es seguro hacer glamping en Colombia?',
    text: 'Sí, el glamping en Colombia es seguro cuando se eligen lugares formales y bien calificados. La mayoría cuenta con personal, protocolos y ubicaciones turísticas confiables. Se recomienda revisar reseñas y seguir las indicaciones del lugar.'
  }
]

export function FaqCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(2)
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
        setItemsPerView(window.innerWidth >= 768 ? 2 : 1)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, FAQ_ITEMS.length - itemsPerView)
      return prev >= maxIndex ? 0 : prev + 1
    })
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, FAQ_ITEMS.length - itemsPerView)
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
          Todo lo que necesitas saber antes de reservar un glamping en Colombia
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
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-1/2 px-2"
              >
                <div className="p-8 rounded-2xl border border-stone-200 bg-stone-50 hover:border-brand hover:shadow-lg transition-all duration-300 h-full">
                  <h3 className="text-xl font-bold text-stone-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-base text-stone-600 leading-relaxed">
                    {item.text}
                  </p>
                </div>
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
          {FAQ_ITEMS.map((_, index) => (
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