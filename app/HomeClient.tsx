'use client'

import { useEffect, useRef, useState, useMemo, type ReactNode } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, X, ChevronRight, ChevronLeft, Home, Shield, Wallet, MessageCircle, MessageSquare, Sparkles, MapPin as MapPinIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSearchStore } from '@/store/searchStore'
import { useGlampingsHome } from '@/hooks/useGlampings'
import { SearchBar, FilterChips } from '@/components/home/SearchFilters'
import { GlampingCard } from '@/components/glamping/GlampingCard'
import { SkeletonCard } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { formatCOP } from '@/lib/utils'
import { buildUrlFromFiltros } from '@/lib/filtros'
import { FaqCarousel } from '@/components/home/FaqCarousel'
import { BenefitsCarousel } from '@/components/home/BenefitsCarousel'
import { TierramontSection } from '@/components/home/TierramontSection'
import type { FiltrosHome, HomeResponse } from '@/types'

const ORDER_LABELS: Record<string, string> = {
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  distancia: 'Más cercanos',
}

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
  tierramontProducts?: unknown[]
  heroTitle?: string
  heroIntro?: string
  carouselSection?: ReactNode
}

export function HomeClient({ initialFiltros, serverData, tierramontProducts, heroTitle, heroIntro, carouselSection }: Props) {
  const { filtros, setFiltros, replaceFiltros, resetFiltros } = useSearchStore()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lastKeyRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  // Estado para transición suave de cards
  const [cardsVisible, setCardsVisible] = useState(true)
  const isTransitioning = useRef(false)

  // Sincronizar filtros con initialFiltros cuando cambia la URL
  useEffect(() => {
    const currentKey = pathname + '?' + searchParams.toString()
    if (currentKey !== lastKeyRef.current) {
      lastKeyRef.current = currentKey
      // Usar replaceFiltros para hacer un solo update (evita dos búsquedas)
      replaceFiltros(initialFiltros || {})
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    setReady(true)
  }, [pathname, searchParams.toString()]) // eslint-disable-line

  // Obtener page directamente de searchParams para la query (más confiable)
  const pageFromUrl = searchParams.get('page')
  const effectivePage = pageFromUrl ? Number(pageFromUrl) : 1

  // useMemo para estabilizar el objeto y que React Query detecte cambios correctamente
  const effectiveFiltros = useMemo(() => ({
    ...filtros,
    page: effectivePage > 1 ? effectivePage : undefined
  }), [filtros, effectivePage])

  const { data: queryData, isLoading, isFetching } = useGlampingsHome(effectiveFiltros, ready)

  // Marcar cuando la primera carga cliente-side termina (para no mostrar popup en carga inicial)
  const initialFetchDone = useRef(false)
  if (queryData && !isFetching) initialFetchDone.current = true

  // Resetear initialFetchDone cuando cambia la ruta clave (para evitar popup instantáneo al volver)
  useEffect(() => {
    initialFetchDone.current = false
  }, [pathname]) // eslint-disable-line

  // Transición suave: fade out al buscar, fade in cuando llegan datos
  useEffect(() => {
    if (!ready) return

    if (isFetching && initialFetchDone.current && !isTransitioning.current) {
      // Iniciar fade out
      isTransitioning.current = true
      setCardsVisible(false)
    } else if (!isFetching && queryData && isTransitioning.current) {
      // Iniciar fade in con un pequeño delay
      const timeout = setTimeout(() => {
        setCardsVisible(true)
        isTransitioning.current = false
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [isFetching, queryData, ready])

  // Mostrar datos de la query si están disponibles, si no usar serverData (SSR)
  const data = queryData ?? serverData
  const total = data?.total ?? 0
  const glampings = data?.data ?? []
  const currentPage = effectivePage
  const totalPages = Math.ceil(total / (filtros.limit ?? 20)) || 1
  const showSearchPopup = isFetching && ready && initialFetchDone.current
  // Mostrar skeleton solo si no hay datos ni de SSR ni de query
  const showLoading = (!serverData && !queryData) && (!ready || isLoading)
  
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
    <div className="w-full lg:w-[90%] mx-auto px-4 sm:px-6">

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
        const defaultHeroText = esBogota
          ? 'RESERVA LOS MEJORES GLAMPINGS CERCA DE BOGOTÁ'
          : esMedellin
          ? 'RESERVA LOS MEJORES GLAMPINGS CERCA DE MEDELLÍN'
          : 'DESCUBRE GLAMPING Y ALOJAMIENTOS RURALES INCREÍBLES PARA RESERVAR EN COLOMBIA'

        const displayTitle = heroTitle ? heroTitle.toUpperCase() : defaultHeroText

        return (
          <div className="pt-6 pb-2">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={heroImg}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 text-center pt-12 pb-16 sm:pt-16 sm:pb-20 px-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {displayTitle}
                </h1>
                {heroIntro && (
                  <p className="mt-3 text-sm sm:text-base text-white/85 drop-shadow max-w-2xl mx-auto">
                    {heroIntro}
                  </p>
                )}
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
      <div id="resultados" className="mt-4 mb-2">
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
      {/* Popup de búsqueda — solo al buscar, no en carga inicial */}
      {showSearchPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 animate-popupIn max-w-xs w-full mx-4">
            {/* Carpa animada */}
            <div className="relative w-20 h-20">
              {/* Estrellas */}
              <span className="absolute top-0 left-2 text-xs text-amber-400 animate-twinkle">✦</span>
              <span className="absolute top-3 right-1 text-[10px] text-amber-300 animate-twinkle" style={{ animationDelay: '0.4s' }}>✦</span>
              <span className="absolute top-1 right-5 text-[8px] text-amber-200 animate-twinkle" style={{ animationDelay: '0.8s' }}>✦</span>
              {/* Carpa */}
              <svg className="w-full h-full animate-tentPulse" viewBox="0 0 80 80" fill="none">
                <path d="M40 10 L72 65 L8 65 Z" fill="#0D261B" />
                <path d="M40 10 L40 65" stroke="#1a4a3a" strokeWidth="1.5" />
                <path d="M30 45 L30 65 L50 65 L50 45" fill="#fbbf24" opacity="0.5" />
                <path d="M30 45 Q40 38 50 45" fill="#fbbf24" opacity="0.3" />
                {/* Fogata */}
                <ellipse cx="22" cy="63" rx="6" ry="2" fill="#92400e" opacity="0.3" />
                <path d="M19 62 Q22 54 25 62" fill="#f97316" className="animate-fireFlicker" />
                <path d="M20 62 Q22 56 24 62" fill="#fbbf24" className="animate-fireFlicker" style={{ animationDelay: '0.2s' }} />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-stone-800 font-semibold text-base">Estamos buscando tu alojamiento</p>
              <p className="text-stone-400 text-sm mt-1">Un momento...</p>
            </div>
            {/* Barra de progreso */}
            <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <div className="h-full bg-brand rounded-full animate-loadBar" />
            </div>
          </div>
        </div>
      )}
      {showLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
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
                <span className="flex items-center gap-2 text-stone-400">
                  {total} glampings encontrados
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
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 transition-all duration-300 ease-out ${
            cardsVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}>
            {glampings.map((g) => <GlampingCard key={g.id} glamping={g} />)}
          </div>
          {totalPages > 1 && (
            <nav aria-label="Paginación de glampings" className="flex justify-center items-center gap-3 mt-12">
              {currentPage > 1 ? (
                <Link
                  href={buildUrlFromFiltros({ ...filtros, page: currentPage - 1 })}
                  rel="prev"
                  onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:border-brand hover:text-brand transition-colors text-sm font-medium"
                >
                  <ChevronLeft size={16} /> Anterior
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50 text-stone-300 text-sm font-medium cursor-not-allowed">
                  <ChevronLeft size={16} /> Anterior
                </span>
              )}

              <span className="text-sm text-stone-500 px-2">
                {isFetching ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                  </span>
                ) : (
                  <><strong className="text-stone-800">{currentPage}</strong> / {totalPages}</>
                )}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={buildUrlFromFiltros({ ...filtros, page: currentPage + 1 })}
                  rel="next"
                  onClick={() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:border-brand hover:text-brand transition-colors text-sm font-medium"
                >
                  Siguiente <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-100 bg-stone-50 text-stone-300 text-sm font-medium cursor-not-allowed">
                  Siguiente <ChevronRight size={16} />
                </span>
              )}
            </nav>
          )}
        </>
      )}

      {/* ── Beneficios ──────────────────────────────────────────────────── */}
      <BenefitsCarousel />

      {/* ── Carrusel de Categorías ──────────────────────────────────────── */}
      {carouselSection}

      {/* ── FAQ / Contenido Informativo ───────────────────────────────────── */}
      <FaqCarousel />

      {/* ── Productos Tierramont ─────────────────────────────────────────── */}
      <TierramontSection initialProducts={tierramontProducts} />
    </div>
  )
}
