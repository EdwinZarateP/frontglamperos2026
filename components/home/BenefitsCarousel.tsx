'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Shield, Wallet, MessageCircle, MessageSquare, Sparkles, MapPin as MapPinIcon } from 'lucide-react'

const BENEFITS = [
  {
    icon: Shield,
    title: 'Reserva segura y alojamientos verificados',
    description: 'Tu tranquilidad es lo primero. En Glamperos cada alojamiento está validado y tu reserva queda protegida desde el momento en que confirmas.'
  },
  {
    icon: Wallet,
    title: 'Flexibilidad total para pagar',
    description: 'Separa tu estadía con solo el 50% y paga el resto al llegar. Planear tu escapada nunca había sido tan fácil ni tan accesible.'
  },
  {
    icon: MessageCircle,
    title: 'Habla directamente con tu anfitrión',
    description: 'En cada alojamiento encontrarás la opción "Escríbele a tu anfitrión" para resolver dudas, coordinar detalles y sentirte seguro antes de reservar.'
  },
  {
    icon: MessageSquare,
    title: 'Soporte inmediato por WhatsApp',
    description: '¿Necesitas información extra o tu anfitrión no responde rápido? Escríbenos y te ayudamos en cuestión de minutos.'
  },
  {
    icon: Sparkles,
    title: 'Experiencias y servicios personalizados',
    description: 'Cenas románticas, decoraciones, pasadías y más. Puedes agregar todo lo que desees a tu reserva antes de pagar y crear una estadía inolvidable.'
  },
  {
    icon: MapPinIcon,
    title: 'Un lugar dedicado a Colombia',
    description: 'A diferencia de plataformas globales, en Glamperos encuentras solo alojamientos rurales, ecológicos y hechos con amor en Colombia. Aquí apoyas directamente el turismo local y rural.'
  }
]

export function BenefitsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(3)

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
      const maxIndex = Math.max(0, BENEFITS.length - itemsPerView)
      return prev >= maxIndex ? 0 : prev + 1
    })
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, BENEFITS.length - itemsPerView)
      return prev === 0 ? maxIndex : prev - 1
    })
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <section className="mt-16 mb-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
          ¿Por qué reservar glampings en Glamperos?
        </h2>
        <p className="text-stone-500 max-w-2xl mx-auto">
          Descubre los beneficios que nos hacen diferentes
        </p>
      </div>

      <div className="relative">
        {/* Flecha izquierda */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Anterior"
        >
          <ChevronLeft size={24} className="text-stone-700" />
        </button>

        {/* Carrusel */}
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
          >
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-2"
                >
                  <div className="group p-6 rounded-2xl border border-stone-200 bg-white hover:border-brand hover:shadow-lg transition-all duration-300 h-full">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
                      <Icon size={28} className="text-brand group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Flecha derecha */}
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Siguiente"
        >
          <ChevronRight size={24} className="text-stone-700" />
        </button>

        {/* Indicadores (dots) */}
        <div className="flex justify-center gap-2 mt-6">
          {BENEFITS.map((_, index) => (
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