'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { useGlampingsHome } from '@/hooks/useGlampings'
import { SearchFilters } from '@/components/home/SearchFilters'
import { GlampingCard } from '@/components/glamping/GlampingCard'
import { SkeletonCard } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { FiltrosHome, HomeResponse } from '@/types'

interface Props {
  initialFiltros?: Partial<FiltrosHome>
  serverData?: HomeResponse
}

export function HomeClient({ initialFiltros, serverData }: Props) {
  const { filtros, setFiltros, resetFiltros } = useSearchStore()
  const pathname = usePathname()
  const lastPathRef = useRef<string | null>(null)
  // ready: false hasta que el useEffect sincronice los filtros con la URL.
  // Durante SSR y el primer render del cliente siempre es false → usamos serverData.
  const [ready, setReady] = useState(false)

  // Sincronizar filtros de URL → store y habilitar la query
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname
      resetFiltros()
      if (initialFiltros && Object.keys(initialFiltros).length > 0) {
        setFiltros(initialFiltros)
      }
    }
    setReady(true)
  }, [pathname]) // eslint-disable-line

  // Geolocalización (solo si la URL no fija una ciudad)
  useEffect(() => {
    if (navigator.geolocation && !initialFiltros?.lat) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setFiltros({ lat: coords.latitude, lng: coords.longitude }),
        () => {}
      )
    }
  }, []) // eslint-disable-line

  // La query solo corre después de que los filtros se sincronizaron (ready=true)
  const { data: queryData, isLoading, isFetching } = useGlampingsHome(filtros, ready)

  // Mientras no haya query data, usamos los datos del servidor (SSR).
  // Esto asegura que el HTML inicial tenga contenido para bots y JS deshabilitado.
  const data = queryData ?? serverData

  const total    = data?.total ?? 0
  const glampings = data?.data ?? []
  const hasMore  = (filtros.page ?? 1) * (filtros.limit ?? 20) < total

  // Mostrar skeletons solo si no hay ningún dato disponible aún
  const showLoading = !data && (!ready || isLoading)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Header */}
      <div className="mb-8 relative rounded-2xl overflow-hidden">
        <img
          src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center py-14 px-6 sm:py-20">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            DESCUBRE GLAMPING Y ALOJAMIENTOS RURALES INCREIBLES PARA RESERVAR EN COLOMBIA
          </h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-8">
        <SearchFilters />
      </div>

      {/* Resultados */}
      {showLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : glampings.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🏕️</p>
          <h2 className="text-xl font-semibold text-stone-700 mb-2">
            No encontramos glampings
          </h2>
          <p className="text-stone-400 mb-6">Intenta cambiar los filtros de búsqueda</p>
          <Button variant="outline" onClick={() => { resetFiltros(); }}>
            Ver todos los glampings
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-500">
              {isFetching && ready ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
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
            {glampings.map((g) => (
              <GlampingCard key={g.id} glamping={g} />
            ))}
          </div>

          {/* Paginación */}
          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setFiltros({ page: (filtros.page ?? 1) + 1 })}
                loading={isFetching}
              >
                Cargar más glampings
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
