'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const REGIONES = [
  {
    slug: 'cundinamarca',
    nombre: 'Cundinamarca',
    descripcion: 'San Francisco, Tequendama, Guatavita, La Vega y alrededores',
    imagen: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/cundinamarca.jpg',
  },
  {
    slug: 'antioquia',
    nombre: 'Antioquia',
    descripcion: 'Medellín, Guatapé, Girardota, La Estrella y alrededores',
    imagen: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/antioquiacard.jpg',
  },
  {
    slug: 'valle',
    nombre: 'Valle del Cauca',
    descripcion: 'Cali, Jamundí, Dapa, Tuluá y alrededores',
    imagen: 'https://storage.googleapis.com/glamperos-imagenes/glampings/alas-glamping_20260509_201121_e646e67e.webp',
  },
  {
    slug: 'santander',
    nombre: 'Santander',
    descripcion: 'Lebrija, Barichara y Vélez',
    imagen: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/Barichara.webp',
  },
  {
    slug: 'boyaca',
    nombre: 'Boyacá',
    descripcion: 'Paipa y Tinjacá',
    imagen: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/boyaca.jpg',
  },
]

export function RegionCards() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  return (
    <section className="mt-16 mb-20">
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
          Encuentra glamping en las principales regiones
        </h2>
        <p className="text-stone-500 max-w-2xl mx-auto">
          Explora los mejores destinos de glamping en Colombia
        </p>
      </div>

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
          className="flex gap-6 overflow-x-auto pb-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {REGIONES.map((region) => (
            <div key={region.slug} className="flex-none w-80 sm:w-96">
              <Link
                href={`/${region.slug}`}
                className="group relative rounded-2xl overflow-hidden h-64 shadow-md hover:shadow-xl transition-all duration-300 block"
              >
                {/* Imagen de fondo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${region.imagen}')` }}
                >
                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Contenido */}
                <div className="relative h-full flex flex-col justify-end p-6">
                  <div className="transform transition-transform duration-300 group-hover:translate-y-[-4px]">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
                      <MapPin size={16} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {region.nombre}
                    </h3>
                    <p className="text-stone-200 text-sm mb-3">
                      {region.descripcion}
                    </p>
                    <div className="flex items-center gap-1 text-white font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Ver glampings
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
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
