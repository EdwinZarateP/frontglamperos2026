'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X, Calendar, Users, MapPin } from 'lucide-react'
import { useSearchStore } from '@/store/searchStore'
import { Button } from '@/components/ui/Button'
import { cn, formatCOP } from '@/lib/utils'
import { buildUrlFromFiltros } from '@/lib/filtros'
import { TipoGlampingIcon } from '@/components/ui/TipoGlampingIcon'

const GCS = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos'

type FiltroChip =
  | { key: string; label: string; icon: React.ReactNode; tipo: string }
  | { key: string; label: string; icon: React.ReactNode; amenidad: string }
  | { key: string; label: string; icon: React.ReactNode; lat: number; lng: number }

const FILTROS_RAPIDOS: FiltroChip[] = [
  { key: 'domo',       label: 'Domo',       icon: <TipoGlampingIcon tipo="domo"       size={20} />, tipo: 'domo' },
  { key: 'cabana',     label: 'Cabaña',     icon: <TipoGlampingIcon tipo="cabana"     size={20} />, tipo: 'cabana' },
  { key: 'chalet',     label: 'Chalet',     icon: <TipoGlampingIcon tipo="chalet"     size={20} />, tipo: 'chalet' },
  { key: 'tiny_house', label: 'Tiny House', icon: <TipoGlampingIcon tipo="tiny_house" size={20} />, tipo: 'tiny_house' },
  { key: 'tipi',       label: 'Tipi',       icon: <TipoGlampingIcon tipo="tipi"       size={20} />, tipo: 'tipi' },
  { key: 'jacuzzi',    label: 'Jacuzzi',    icon: <img src={`${GCS}/icono%20Jacuzzi%201.svg`} width={20} height={20} alt="" />, amenidad: 'jacuzzi' },
  { key: 'piscina',    label: 'Piscina',    icon: <img src={`${GCS}/icono%20Piscina%201.svg`} width={20} height={20} alt="" />, amenidad: 'piscina' },
  { key: 'bogota',     label: 'Bogotá',     icon: <img src={`${GCS}/icono%20Bogota2.svg`}      width={20} height={20} alt="" />, lat: 4.71, lng: -74.07 },
  { key: 'medellin',   label: 'Medellín',   icon: <img src={`${GCS}/icono%20Medellin%201.svg`} width={20} height={20} alt="" />, lat: 6.24, lng: -75.58 },
]

export function SearchFilters() {
  const { filtros, setFiltros, resetFiltros } = useSearchStore()
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [ciudad, setCiudad] = useState(filtros.ciudad || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFiltros({ ciudad: ciudad || undefined })
  }

  const hasFilters =
    filtros.tipo || filtros.ciudad || filtros.fecha_inicio || filtros.huespedes || filtros.precio_max

  return (
    <div className="w-full">
      {/* Barra de búsqueda principal */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-0 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden"
      >
        {/* Fila 1: Ciudad */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100">
          <MapPin size={18} className="text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder="¿A dónde quieres ir?"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className="flex-1 outline-none text-sm text-stone-700 placeholder:text-stone-400 bg-transparent"
          />
          {ciudad && (
            <button type="button" onClick={() => { setCiudad(''); setFiltros({ ciudad: undefined }) }}>
              <X size={14} className="text-stone-400" />
            </button>
          )}
        </div>

        {/* Fila 2: Fechas + Huéspedes + Botones */}
        <div className="flex flex-col sm:flex-row gap-0">
          {/* Fechas */}
          <div className="flex items-center gap-2 px-4 py-3 flex-1 border-b sm:border-b-0 sm:border-r border-stone-100">
            <Calendar size={16} className="text-stone-400 shrink-0" />
            <div className="flex gap-2 items-center flex-1 min-w-0">
              <input
                type="date"
                value={filtros.fecha_inicio || ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFiltros({ fecha_inicio: e.target.value || undefined })}
                className="flex-1 min-w-0 text-xs text-stone-700 outline-none bg-transparent"
              />
              <span className="text-stone-300 shrink-0">→</span>
              <input
                type="date"
                value={filtros.fecha_fin || ''}
                min={filtros.fecha_inicio || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFiltros({ fecha_fin: e.target.value || undefined })}
                className="flex-1 min-w-0 text-xs text-stone-700 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Huéspedes */}
          <div className="flex items-center gap-2 px-4 py-3 sm:w-36 border-b sm:border-b-0 sm:border-r border-stone-100">
            <Users size={16} className="text-stone-400 shrink-0" />
            <input
              type="number"
              placeholder="Huéspedes"
              min={1}
              max={20}
              value={filtros.huespedes || ''}
              onChange={(e) =>
                setFiltros({ huespedes: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full outline-none text-sm text-stone-700 placeholder:text-stone-400 bg-transparent"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 p-2">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(
                'p-3 rounded-xl transition-colors shrink-0',
                showAdvanced ? 'bg-stone-100 text-stone-700' : 'text-stone-400 hover:text-stone-600'
              )}
              title="Filtros avanzados"
            >
              <SlidersHorizontal size={18} />
            </button>
            <Button type="submit" size="md" fullWidth>
              <Search size={16} />
              <span className="hidden xs:inline">Buscar</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Filtros rápidos (chips) */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
        {/* Chip "Todos" */}
        <button
          onClick={() => {
            resetFiltros()
            router.push('/')
          }}
          className={cn(
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all',
            !filtros.tipo && !filtros.amenidades && !filtros.lat
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
          )}
        >
          Todos
        </button>

        {FILTROS_RAPIDOS.map((f) => {
          let isActive = false
          let nextFiltros: Parameters<typeof setFiltros>[0]

          if ('tipo' in f) {
            isActive = filtros.tipo === f.tipo
            nextFiltros = isActive
              ? { tipo: undefined }
              : { tipo: f.tipo }
          } else if ('amenidad' in f) {
            const current = filtros.amenidades?.split(',') ?? []
            isActive = current.includes(f.amenidad)
            const next = isActive ? current.filter((x) => x !== f.amenidad) : [...current, f.amenidad]
            nextFiltros = { amenidades: next.length ? next.join(',') : undefined }
          } else {
            isActive = filtros.lat === f.lat && filtros.lng === f.lng
            nextFiltros = isActive
              ? { lat: undefined, lng: undefined, order_by: undefined, radio_km: undefined }
              : { lat: f.lat, lng: f.lng, order_by: 'distancia', radio_km: 100 }
          }

          const handleClick = () => {
            setFiltros(nextFiltros)
            const merged = { ...filtros, ...nextFiltros }
            router.push(buildUrlFromFiltros(merged))
          }

          return (
            <button
              key={f.key}
              onClick={handleClick}
              className={cn(
                'shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border transition-all',
                isActive
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              )}
            >
              <span className={cn('transition-all', isActive ? 'brightness-0 invert' : '')}>{f.icon}</span>
              <span className="text-xs">{f.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Precio */}
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Precio máx / noche
              </label>
              <input
                type="range"
                min={100000}
                max={2000000}
                step={50000}
                value={filtros.precio_max || 2000000}
                onChange={(e) => setFiltros({ precio_max: Number(e.target.value) })}
                className="w-full mt-2 accent-emerald-600"
              />
              <p className="text-sm text-stone-700 mt-1">
                {filtros.precio_max ? formatCOP(filtros.precio_max) : 'Sin límite'}
              </p>
            </div>

            {/* Ordenar */}
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Ordenar por
              </label>
              <select
                value={filtros.order_by || ''}
                onChange={(e) =>
                  setFiltros({ order_by: (e.target.value as typeof filtros.order_by) || undefined })
                }
                className="w-full mt-2 rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Relevancia</option>
                <option value="calificacion">Mejor calificados</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="distancia">Más cercanos</option>
              </select>
            </div>

            {/* Amenidades rápidas */}
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                Amenidades
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['wifi', 'jacuzzi', 'piscina', 'fogata', 'parqueadero'].map((a) => {
                  const current = filtros.amenidades?.split(',') || []
                  const active = current.includes(a)
                  return (
                    <button
                      key={a}
                      onClick={() => {
                        const next = active
                          ? current.filter((x) => x !== a)
                          : [...current, a]
                        setFiltros({ amenidades: next.length ? next.join(',') : undefined })
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs border transition-all',
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-stone-600 border-stone-200'
                      )}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={resetFiltros}
              className="mt-4 text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
