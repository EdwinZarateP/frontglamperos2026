'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { MapPin, X, ChevronRight, Home, Shield, Wallet, MessageCircle, MessageSquare, Sparkles, MapPin as MapPinIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSearchStore } from '@/store/searchStore'
import { useGlampingsHome, useGlamping } from '@/hooks/useGlampings'
import { SearchBar, FilterChips } from '@/components/home/SearchFilters'
import { GlampingCard } from '@/components/glamping/GlampingCard'
import { SkeletonCard } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { formatCOP } from '@/lib/utils'
import { buildUrlFromFiltros } from '@/lib/filtros'
import { CategoriasCarouselServer } from '@/components/home/CategoriasCarouselServer'
import type { FiltrosHome, HomeResponse } from '@/types'

const ORDER_LABELS: Record<string, string> = {
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  distancia: 'Más cercanos',
}

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

function FilterBreadcrumb({
  filtros,
  onRemove,
  onReset,
}: {
  filtros: FiltrosHome
  onRemove: (key: keyof FiltrosHome | 'fechas' | 'precio' | 'amenidades_all') => void
  onReset: () => void
}) {
  const chips: { id: string; label: string; removeKey: keyof FiltrosHome | 'fechas' | 'precio' | 'amenidades_all' }[] = []

  if (filtros.ciudad) chips.push({ id: 'ciudad', label: `📍 ${filtros.ciudad}`, removeKey: 'ciudad' })
  if (filtros.tipo) chips.push({ id: 'tipo', label: filtros.tipo, removeKey: 'tipo' })
  if (filtros.huespedes && filtros.huespedes > 1)
    chips.push({ id: 'huespedes', label: `${filtros.huespedes} huéspedes`, removeKey: 'huespedes' })
  if (filtros.fecha_inicio && filtros.fecha_fin)
    chips.push({
      id: 'fechas',
      label: `${format(parseISO(filtros.fecha_inicio), 'd MMM', { locale: es })} → ${format(parseISO(filtros.fecha_fin), 'd MMM', { locale: es })}`,
      removeKey: 'fechas',
    })
  if (filtros.precio_min || filtros.precio_max)
    chips.push({
      id: 'precio',
      label: filtros.precio_max ? `Hasta ${formatCOP(filtros.precio_max)}` : `Desde ${formatCOP(filtros.precio_min!)}`,
      removeKey: 'precio',
    })
  if (filtros.acepta_mascotas)
    chips.push({ id: 'mascotas', label: '🐾 Mascotas', removeKey: 'acepta_mascotas' })
  if (filtros.amenidades)
    chips.push({ id: 'amenidades', label: filtros.amenidades.split(',').join(' · '), removeKey: 'amenidades_all' })
  if (filtros.order_by && filtros.order_by !== 'calificacion' && ORDER_LABELS[filtros.order_by])
    chips.push({ id: 'order', label: ORDER_LABELS[filtros.order_by], removeKey: 'order_by' })

  if (chips.length === 0) return null

  return (
    <nav aria-label="Filtros activos" className="mb-4 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-sm text-stone-400">
        <Home size={13} /><span>Inicio</span>
      </span>
      {chips.map((chip) => (
        <span key={chip.id} className="flex items-center gap-1">
          <ChevronRight size={13} className="text-stone-300" />
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full">
            {chip.label}
            <button
              type="button"
              aria-label={`Quitar ${chip.label}`}
              onClick={() => onRemove(chip.removeKey)}
              className="text-brand hover:text-brand-light"
            >
              <X size={11} />
            </button>
          </span>
        </span>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={onReset} className="ml-1 text-xs text-stone-400 hover:text-stone-600 underline">
          Limpiar todo
        </button>
      )}
    </nav>
  )
}

interface Props {
  initialFiltros?: Partial<FiltrosHome>
  serverData?: HomeResponse
}

export function HomeClient({ initialFiltros, serverData }: Props) {
  const { filtros, setFiltros, resetFiltros } = useSearchStore()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lastKeyRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const currentKey = pathname + '?' + searchParams.toString()
    if (currentKey !== lastKeyRef.current) {
      lastKeyRef.current = currentKey
      resetFiltros()
      if (initialFiltros && Object.keys(initialFiltros).length > 0) {
        setFiltros(initialFiltros)
      }
    }
    setReady(true)
  }, [pathname, searchParams.toString()]) // eslint-disable-line

  const { data: queryData, isLoading, isFetching } = useGlampingsHome(filtros, ready)
  const data = queryData ?? serverData
  const total = data?.total ?? 0
  const glampings = data?.data ?? []
  const hasMore = (filtros.page ?? 1) * (filtros.limit ?? 20) < total
  const showLoading = !data && (!ready || isLoading)
  
  // Obtener imagen del glamping para el carrusel
  const { data: glampingImg } = useGlamping('69b8b1a4776b87a18af6b6f8')
  const carouselImage = glampingImg?.imagenes?.[0]

  const handleRemoveFiltro = (key: keyof FiltrosHome | 'fechas' | 'precio' | 'amenidades_all') => {
    let updated: Partial<FiltrosHome>
    if (key === 'fechas') {
      updated = { ...filtros, fecha_inicio: undefined, fecha_fin: undefined }
    } else if (key === 'precio') {
      updated = { ...filtros, precio_min: undefined, precio_max: undefined }
    } else if (key === 'amenidades_all') {
      updated = { ...filtros, amenidades: undefined }
    } else {
      updated = { ...filtros, [key]: undefined }
    }
    setFiltros(updated)
    router.push(buildUrlFromFiltros(updated))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {(() => {
        const ciudad = filtros.ciudad ?? ''
        const esBogota   = ciudad.toLowerCase().includes('bogot')
        const esMedellin = ciudad.toLowerCase().includes('medell')
        const heroImg = esBogota
          ? 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/monserrate_optimizado.webp'
          : esMedellin
          ? 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/piedra_guatape.webp'
          : 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'
        const heroText = esBogota
          ? 'RESERVA LOS MEJORES GLAMPINGS CERCA DE BOGOTÁ'
          : esMedellin
          ? 'RESERVA LOS MEJORES GLAMPINGS CERCA DE MEDELLÍN'
          : 'DESCUBRE GLAMPING Y ALOJAMIENTOS RURALES INCREÍBLES PARA RESERVAR EN COLOMBIA'

        return (
          <div className="pt-6 pb-2">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={heroImg}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 text-center pt-12 pb-16 sm:pt-16 sm:pb-20 px-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {heroText}
                </h1>
              </div>
            </div>
            {/* SearchBar fuera del overflow-hidden: paneles se abren libremente sin clipping */}
            <div className="relative z-20 max-w-3xl mx-auto px-2 -mt-10">
              <SearchBar />
            </div>
          </div>
        )
      })()}

      {/* ── Chips de tipo/amenidad (fuera del hero, sin conflicto de z-index) */}
      <div className="mt-4 mb-2">
        <FilterChips />
      </div>

      {/* ── Miga de pan ──────────────────────────────────────────────────── */}
      <div className="mt-4">
        <FilterBreadcrumb
          filtros={filtros}
          onRemove={handleRemoveFiltro}
          onReset={() => { resetFiltros(); router.push('/') }}
        />
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      {showLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : glampings.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🏕️</p>
          <h2 className="text-xl font-semibold text-stone-700 mb-2">No encontramos glampings</h2>
          <p className="text-stone-400 mb-6">Intenta cambiar los filtros de búsqueda</p>
          <Button variant="outline" onClick={() => resetFiltros()}>Ver todos los glampings</Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {isFetching && ready ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  Actualizando...
                </span>
              ) : (
                <>
                  <strong className="text-stone-700">{total}</strong> glampings encontrados
                  {filtros.ciudad && (
                    <span className="ml-1 inline-flex items-center gap-1">
                      <MapPin size={12} /> en &ldquo;{filtros.ciudad}&rdquo;
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 animate-fadeInUp">
            {glampings.map((g) => <GlampingCard key={g.id} glamping={g} />)}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button
                variant="outline" size="lg"
                onClick={() => setFiltros({ page: (filtros.page ?? 1) + 1 })}
                loading={isFetching}
              >
                Cargar más glampings
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── Beneficios ──────────────────────────────────────────────────── */}
      <section className="mt-16 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            ¿Por qué reservar glampings en Glamperos?
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto">
            Descubre los beneficios que nos hacen diferentes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-stone-200 bg-white hover:border-brand hover:shadow-lg transition-all duration-300"
              >
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
            )
          })}
        </div>
      </section>

      {/* ── Carrusel de Categorías ──────────────────────────────────────── */}
      <CategoriasCarouselServer glampingImage={carouselImage} />

      {/* ── FAQ / Contenido Informativo ───────────────────────────────────── */}
      <section className="mt-20 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            Todo lo que necesitas saber antes de reservar un glamping en Colombia
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl border border-stone-200 bg-stone-50 hover:border-brand hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                {item.title}
              </h3>
              <p className="text-base text-stone-600 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
