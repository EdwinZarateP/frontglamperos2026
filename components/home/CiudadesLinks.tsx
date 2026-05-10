/**
 * Enlaces de texto a ciudades principales para SEO.
 * Los bots de Google necesitan enlaces <a> para descubrir URLs.
 */
import Link from 'next/link'
import { MapPin } from 'lucide-react'

const CIUDADES_PRINCIPALES = [
  { slug: 'bogota', nombre: 'Bogotá', region: 'Cundinamarca' },
  { slug: 'medellin', nombre: 'Medellín', region: 'Antioquia' },
  { slug: 'cali', nombre: 'Cali', region: 'Valle del Cauca' },
  { slug: 'paipa', nombre: 'Paipa', region: 'Boyacá' },
  { slug: 'guatape', nombre: 'Guatapé', region: 'Antioquia' },
  { slug: 'barichara', nombre: 'Barichara', region: 'Santander' },
  { slug: 'bucaramanga', nombre: 'Bucaramanga', region: 'Santander' },
]

export function CiudadesLinks() {
  return (
    <section className="py-12 bg-stone-50 border-y border-stone-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
            Busca glamping en las principales ciudades de Colombia
          </h2>
          <p className="text-sm text-stone-500">
            Encuentra domos, cabañas y experiencias únicas cerca de tu destino
          </p>
        </div>

        <nav aria-label="Ciudades principales" className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {CIUDADES_PRINCIPALES.map((ciudad) => (
            <Link
              key={ciudad.slug}
              href={`/${ciudad.slug}`}
              className="inline-flex items-center gap-2 text-stone-700 hover:text-emerald-600 transition-colors text-sm group"
            >
              <MapPin size={14} className="text-stone-400 group-hover:text-emerald-500" />
              <span className="font-medium">{ciudad.nombre}</span>
              <span className="text-stone-400 text-xs">· {ciudad.region}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
