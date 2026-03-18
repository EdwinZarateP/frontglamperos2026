'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, Users, Calendar, MapPin, Dog, SlidersHorizontal,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import {
  addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isBefore, isAfter, isWithinInterval, startOfDay,
  getDay, format, parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useSearchStore } from '@/store/searchStore'
import { cn, formatCOP } from '@/lib/utils'
import { buildUrlFromFiltros, FILTROS_TIPOS } from '@/lib/filtros'
import { CIUDADES_COLOMBIA, getCoordenadas } from '@/lib/colombia'
import { TipoGlampingIcon } from '@/components/ui/TipoGlampingIcon'

const GCS = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/iconos'

type Panel = 'location' | 'dates' | 'guests' | null

// ── Chips de filtrado rápido ──────────────────────────────────────────────────
type FiltroChip =
  | { key: string; label: string; icon: React.ReactNode; tipo: string }
  | { key: string; label: string; icon: React.ReactNode; amenidad: string }
  | { key: string; label: string; icon: React.ReactNode; ciudadNombre: string }

const FILTROS_RAPIDOS: FiltroChip[] = [
  { key: 'domo',       label: 'Domo',       icon: <TipoGlampingIcon tipo="domo"       size={20} />, tipo: 'domo' },
  { key: 'cabana',     label: 'Cabaña',     icon: <TipoGlampingIcon tipo="cabana"     size={20} />, tipo: 'cabana' },
  { key: 'chalet',     label: 'Chalet',     icon: <TipoGlampingIcon tipo="chalet"     size={20} />, tipo: 'chalet' },
  { key: 'tiny_house', label: 'Tiny House', icon: <TipoGlampingIcon tipo="tiny_house" size={20} />, tipo: 'tiny_house' },
  { key: 'tipi',       label: 'Tipi',       icon: <TipoGlampingIcon tipo="tipi"       size={20} />, tipo: 'tipi' },
  { key: 'jacuzzi',    label: 'Jacuzzi',    icon: <img src={`${GCS}/icono%20Jacuzzi%201.svg`} width={20} height={20} alt="" />, amenidad: 'jacuzzi' },
  { key: 'piscina',    label: 'Piscina',    icon: <img src={`${GCS}/icono%20Piscina%201.svg`} width={20} height={20} alt="" />, amenidad: 'piscina' },
  { key: 'bogota',     label: 'Bogotá',     icon: <img src={`${GCS}/icono%20Bogota2.svg`}      width={20} height={20} alt="" />, ciudadNombre: 'Bogotá, Cundinamarca' },
  { key: 'medellin',   label: 'Medellín',   icon: <img src={`${GCS}/icono%20Medellin%201.svg`} width={20} height={20} alt="" />, ciudadNombre: 'Medellín, Antioquia' },
]

function fmtDate(d: string) {
  try { return format(parseISO(d), 'd MMM', { locale: es }) } catch { return d }
}

// ── Calendario Airbnb-style ───────────────────────────────────────────────────
function CalendarioRango({
  fechaInicio,
  fechaFin,
  onChange,
}: {
  fechaInicio?: string
  fechaFin?: string
  onChange: (start: string | undefined, end: string | undefined) => void
}) {
  const today = startOfDay(new Date())
  const [mesActual, setMesActual] = useState(startOfMonth(today))
  const [hover, setHover] = useState<Date | null>(null)

  const mesSiguiente = addMonths(mesActual, 1)
  const start = fechaInicio ? startOfDay(parseISO(fechaInicio)) : null
  const end = fechaFin ? startOfDay(parseISO(fechaFin)) : null

  const handleDia = (dia: Date) => {
    if (isBefore(dia, today) && !isSameDay(dia, today)) return

    if (!start || (start && end)) {
      // Empezar nueva selección
      onChange(format(dia, 'yyyy-MM-dd'), undefined)
    } else {
      // Ya tenemos inicio, elegir fin
      if (isBefore(dia, start) || isSameDay(dia, start)) {
        onChange(format(dia, 'yyyy-MM-dd'), undefined)
      } else {
        onChange(format(start, 'yyyy-MM-dd'), format(dia, 'yyyy-MM-dd'))
      }
    }
  }

  const renderMes = (mes: Date) => {
    const diasMes = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) })
    const primerDia = (getDay(startOfMonth(mes)) + 6) % 7 // lunes=0
    const efectivoFin = end ?? (hover && start && isAfter(hover, start) ? hover : null)

    return (
      <div className="flex-1 min-w-[260px]">
        <p className="text-center font-semibold text-stone-800 mb-3 capitalize">
          {format(mes, 'MMMM yyyy', { locale: es })}
        </p>

        {/* Días de semana */}
        <div className="grid grid-cols-7 mb-1">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-stone-400 py-1">{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className="grid grid-cols-7">
          {/* padding inicial */}
          {Array.from({ length: primerDia }).map((_, i) => <div key={`p${i}`} />)}

          {diasMes.map((dia) => {
            const isPast = isBefore(dia, today) && !isSameDay(dia, today)
            const isStart = !!start && isSameDay(dia, start)
            const isEnd = !!end && isSameDay(dia, end)
            const isHoverEnd = !end && !!hover && !!start && isSameDay(dia, hover) && isAfter(hover, start)
            const inRange = !!start && !!efectivoFin
              && isWithinInterval(dia, { start, end: efectivoFin })
              && !isStart && !(isEnd || isHoverEnd)

            // Clases para el fondo de rango (media cápsula izquierda/derecha)
            const bgLeft  = inRange || isEnd || isHoverEnd
            const bgRight = inRange || isStart

            return (
              <div
                key={dia.toISOString()}
                className="relative flex items-center justify-center py-[2px]"
                onMouseEnter={() => setHover(dia)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Fondo rango: mitad derecha del inicio */}
                {bgRight && (
                  <div className="absolute inset-y-0 left-1/2 right-0 bg-emerald-50" />
                )}
                {/* Fondo rango: mitad izquierda del fin */}
                {bgLeft && (
                  <div className="absolute inset-y-0 right-1/2 left-0 bg-emerald-50" />
                )}

                <button
                  type="button"
                  onClick={() => !isPast && handleDia(dia)}
                  disabled={isPast}
                  className={cn(
                    'relative z-10 w-9 h-9 flex items-center justify-center text-sm rounded-full transition-colors select-none',
                    isPast && 'text-stone-300 cursor-not-allowed',
                    !isPast && !isStart && !isEnd && !isHoverEnd && 'hover:bg-stone-100 text-stone-700 cursor-pointer',
                    (isStart || isEnd || isHoverEnd) && 'bg-emerald-600 text-white font-semibold',
                    isSameDay(dia, today) && !isStart && !isEnd && 'font-bold text-emerald-700',
                  )}
                >
                  {format(dia, 'd')}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const puedeRetroceder = isAfter(mesActual, startOfMonth(today))

  return (
    <div className="p-4 select-none">
      {/* Cabecera de navegación */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => puedeRetroceder && setMesActual((m) => addMonths(m, -1))}
          className={cn(
            'p-1.5 rounded-full transition-colors',
            puedeRetroceder ? 'hover:bg-stone-100 text-stone-600' : 'text-stone-200 cursor-not-allowed'
          )}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setMesActual((m) => addMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>

      {/* Dos meses */}
      <div className="flex gap-6">
        {renderMes(mesActual)}
        <div className="w-px bg-stone-100 hidden sm:block shrink-0" />
        <div className="hidden sm:block">{renderMes(mesSiguiente)}</div>
      </div>

      {/* Footer */}
      {(fechaInicio || fechaFin) && (
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <p className="text-sm text-stone-600">
            {fechaInicio && (
              <span>
                {fmtDate(fechaInicio)}
                {fechaFin && <> → {fmtDate(fechaFin)}</>}
                {!fechaFin && <span className="text-stone-400 ml-1">— elige salida</span>}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => onChange(undefined, undefined)}
            className="text-xs text-stone-400 hover:text-stone-700 underline"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// SearchBar — barra principal con paneles desplegables
// ────────────────────────────────────────────────────────────────────────────
export function SearchBar() {
  const { filtros, setFiltros, resetFiltros } = useSearchStore()
  const router = useRouter()

  const [activePanel, setActivePanel] = useState<Panel>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ── Estado LOCAL de los filtros (no se envía al store hasta "Buscar") ──────
  const [locationInput,    setLocationInput]    = useState(filtros.ciudad || '')
  const [localFechaInicio, setLocalFechaInicio] = useState(filtros.fecha_inicio)
  const [localFechaFin,    setLocalFechaFin]    = useState(filtros.fecha_fin)
  const [localHuespedes,   setLocalHuespedes]   = useState(filtros.huespedes || 2)
  const [localMascotas,    setLocalMascotas]    = useState(filtros.acepta_mascotas || false)
  const [localPrecioMax,   setLocalPrecioMax]   = useState(filtros.precio_max)
  const [localOrderBy,     setLocalOrderBy]     = useState(filtros.order_by)
  const [localAmenidades,  setLocalAmenidades]  = useState(filtros.amenidades)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync local ← store cuando los filtros cambian desde afuera
  // (ej: miga de pan quita un filtro, URL cambia, resetFiltros)
  useEffect(() => { setLocationInput(filtros.ciudad || '') },          [filtros.ciudad])
  useEffect(() => { setLocalFechaInicio(filtros.fecha_inicio) },       [filtros.fecha_inicio])
  useEffect(() => { setLocalFechaFin(filtros.fecha_fin) },             [filtros.fecha_fin])
  useEffect(() => { setLocalHuespedes(filtros.huespedes || 2) },       [filtros.huespedes])
  useEffect(() => { setLocalMascotas(filtros.acepta_mascotas || false) }, [filtros.acepta_mascotas])
  useEffect(() => { setLocalPrecioMax(filtros.precio_max) },           [filtros.precio_max])
  useEffect(() => { setLocalOrderBy(filtros.order_by) },               [filtros.order_by])
  useEffect(() => { setLocalAmenidades(filtros.amenidades) },          [filtros.amenidades])

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePanel(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Foco al abrir panel de location
  useEffect(() => {
    if (activePanel === 'location') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [activePanel])

  const togglePanel = (panel: Panel) =>
    setActivePanel((p) => (p === panel ? null : panel))

  // Filtro de ciudades
  const ciudadesFiltradas = locationInput.trim().length >= 2
    ? CIUDADES_COLOMBIA.filter((c) =>
        c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .includes(locationInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      ).slice(0, 8)
    : []

  const selectCity = (_ciudad: string, label: string) => {
    // Solo actualiza el estado local — no toca el store hasta "Buscar"
    setLocationInput(label)
    setActivePanel('dates')
  }

  const handleSearch = () => {
    const input = locationInput.trim()
    const foundCity = input
      ? CIUDADES_COLOMBIA.find(c => c.label === input || c.ciudad.toLowerCase() === input.toLowerCase())
      : null
    const ciudadLabel = foundCity?.label ?? (input || undefined)
    // Buscar coordenadas para radio search (muestra glampings cercanos aunque la ciudad no tenga ninguno exacto)
    const coords = foundCity ? getCoordenadas(foundCity.ciudad, foundCity.departamento) : null

    // ÚNICO punto donde se actualiza el store → dispara el fetch
    const merged = {
      ...filtros,
      ciudad:          ciudadLabel,
      lat:             coords?.lat,
      lng:             coords?.lng,
      radio_km:        coords ? 130 : undefined,
      fecha_inicio:    localFechaInicio,
      fecha_fin:       localFechaFin,
      huespedes:       localHuespedes > 2 ? localHuespedes : undefined,
      acepta_mascotas: localMascotas || undefined,
      precio_max:      localPrecioMax,
      order_by:        localOrderBy,
      amenidades:      localAmenidades,
    }
    setFiltros(merged)
    setActivePanel(null)
    router.push(buildUrlFromFiltros(merged))
  }

  const hasFilters = filtros.tipo || filtros.ciudad || localFechaInicio || localHuespedes > 2 || localMascotas || localPrecioMax

  // El label de fechas lee del estado LOCAL (muestra la selección pendiente)
  const datesLabel = (() => {
    if (localFechaInicio && localFechaFin)
      return `${fmtDate(localFechaInicio)} → ${fmtDate(localFechaFin)}`
    if (localFechaInicio) return `Desde ${fmtDate(localFechaInicio)}`
    return null
  })()

  const guestsLabel = (() => {
    const parts: string[] = []
    if (localHuespedes > 1) parts.push(`${localHuespedes} huéspedes`)
    if (localMascotas) parts.push('mascota')
    return parts.join(', ') || null
  })()

  return (
    <div ref={containerRef} className="w-full" style={{ isolation: 'isolate' }}>

      {/* ── Barra principal ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200">
        <div className="flex flex-col sm:flex-row">

          {/* ── LOCATION ── cada sección tiene su propio relative para que el panel quede bajo ella */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => togglePanel('location')}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-4 text-left transition-colors rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none border-b sm:border-b-0 sm:border-r border-stone-100',
                activePanel === 'location' ? 'bg-stone-50' : 'hover:bg-stone-50/60'
              )}
            >
              <MapPin size={16} className="text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">¿A dónde?</p>
                <p className={cn('text-sm truncate', locationInput ? 'text-stone-800 font-medium' : 'text-stone-400')}>
                  {locationInput || 'Explorar destinos'}
                </p>
              </div>
              {locationInput && (
                <span
                  role="button"
                  aria-label="Limpiar destino"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setLocationInput('')
                    setFiltros({ ciudad: undefined, lat: undefined, lng: undefined })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      setLocationInput('')
                      setFiltros({ ciudad: undefined, lat: undefined, lng: undefined })
                    }
                  }}
                  className="cursor-pointer"
                >
                  <X size={14} className="text-stone-400 hover:text-stone-700" />
                </span>
              )}
            </button>

            {/* Panel de ubicación — justo debajo de este botón */}
            {activePanel === 'location' && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Destino</p>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ciudad o municipio en Colombia"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-3"
                />
                {ciudadesFiltradas.length > 0 ? (
                  <ul className="space-y-1 max-h-52 overflow-y-auto">
                    {ciudadesFiltradas.map((c) => (
                      <li key={c.slug}>
                        <button
                          type="button"
                          onClick={() => selectCity(c.ciudad, c.label)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                        >
                          <MapPin size={13} className="text-emerald-500 shrink-0" />
                          <span>
                            <span className="font-medium">{c.ciudad}</span>
                            <span className="text-stone-400">, {c.departamento}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : locationInput.trim().length < 2 ? (
                  <p className="text-sm text-stone-400 text-center py-4">Escribe al menos 2 letras para buscar</p>
                ) : (
                  <p className="text-sm text-stone-400 text-center py-4">Sin resultados para "{locationInput}"</p>
                )}
              </div>
            )}
          </div>

          {/* ── DATES ── */}
          <div className="relative sm:w-52">
            <button
              type="button"
              onClick={() => togglePanel('dates')}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-4 text-left transition-colors border-b sm:border-b-0 sm:border-r border-stone-100',
                activePanel === 'dates' ? 'bg-stone-50' : 'hover:bg-stone-50/60'
              )}
            >
              <Calendar size={16} className="text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Fechas</p>
                <p className={cn('text-sm truncate', datesLabel ? 'text-stone-800 font-medium' : 'text-stone-400')}>
                  {datesLabel || 'Agregar fechas'}
                </p>
              </div>
            </button>

            {/* Panel de fechas — calendario Airbnb */}
            {activePanel === 'dates' && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 w-[320px] sm:w-[580px]">
                <CalendarioRango
                  fechaInicio={localFechaInicio}
                  fechaFin={localFechaFin}
                  onChange={(start, end) => {
                    setLocalFechaInicio(start)
                    setLocalFechaFin(end)
                    // Al completar el rango avanza al siguiente panel
                    if (start && end) setActivePanel('guests')
                  }}
                />
              </div>
            )}
          </div>

          {/* ── GUESTS ── */}
          <div className="relative sm:w-44">
            <button
              type="button"
              onClick={() => togglePanel('guests')}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-4 text-left transition-colors border-b sm:border-b-0 border-stone-100',
                activePanel === 'guests' ? 'bg-stone-50' : 'hover:bg-stone-50/60'
              )}
            >
              <Users size={16} className="text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Viajeros</p>
                <p className={cn('text-sm truncate', guestsLabel ? 'text-stone-800 font-medium' : 'text-stone-400')}>
                  {guestsLabel || 'Agregar'}
                </p>
              </div>
            </button>

            {/* Panel de viajeros */}
            {activePanel === 'guests' && (
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 z-50">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-4">Viajeros</p>

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-medium text-stone-800">Huéspedes</p>
                    <p className="text-xs text-stone-400">Adultos y niños</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLocalHuespedes((h) => Math.max(1, h - 1))}
                      className="w-8 h-8 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-500"
                    >−</button>
                    <span className="w-6 text-center font-semibold text-stone-900">{localHuespedes}</span>
                    <button
                      type="button"
                      onClick={() => setLocalHuespedes((h) => Math.min(20, h + 1))}
                      className="w-8 h-8 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-500"
                    >+</button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                    <Dog size={16} className="text-stone-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800">Mascotas</p>
                      <p className="text-xs text-stone-400 leading-tight">Solo glampings que aceptan</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalMascotas((v) => !v)}
                    className={cn(
                      'shrink-0 w-11 h-6 rounded-full transition-colors relative',
                      localMascotas ? 'bg-emerald-500' : 'bg-stone-200'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                      localMascotas ? 'left-[22px]' : 'left-0.5'
                    )} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="mt-5 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Listo
                </button>
              </div>
            )}
          </div>

          {/* ── ACTIONS ── */}
          <div className="flex items-center gap-2 p-3">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(
                'p-3 rounded-xl transition-colors shrink-0 text-stone-400 hover:text-stone-600',
                showAdvanced && 'bg-stone-100 text-stone-700'
              )}
              title="Filtros avanzados"
            >
              <SlidersHorizontal size={18} />
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtros avanzados ────────────────────────────────────────────── */}
      {showAdvanced && (
        <div className="mt-3 p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Precio máx / noche</label>
              <input
                type="range" min={100000} max={2000000} step={50000}
                value={localPrecioMax || 2000000}
                onChange={(e) => setLocalPrecioMax(Number(e.target.value) || undefined)}
                className="w-full mt-2 accent-emerald-600"
              />
              <p className="text-sm text-stone-700 mt-1">
                {localPrecioMax ? formatCOP(localPrecioMax) : 'Sin límite'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Ordenar por</label>
              <select
                value={localOrderBy || ''}
                onChange={(e) => setLocalOrderBy((e.target.value as typeof filtros.order_by) || undefined)}
                className="w-full mt-2 rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Relevancia</option>
                <option value="calificacion">Mejor calificados</option>
                <option value="precio_asc">Precio: menor a mayor</option>
                <option value="precio_desc">Precio: mayor a menor</option>
                <option value="distancia">Más cercanos</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Amenidades</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['wifi', 'jacuzzi', 'piscina', 'fogata', 'parqueadero'].map((a) => {
                  const current = localAmenidades?.split(',') || []
                  const active = current.includes(a)
                  return (
                    <button
                      key={a} type="button"
                      onClick={() => {
                        const next = active ? current.filter((x) => x !== a) : [...current, a]
                        setLocalAmenidades(next.length ? next.join(',') : undefined)
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs border transition-all',
                        active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                      )}
                    >{a}</button>
                  )
                })}
              </div>
            </div>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                resetFiltros()
                setLocationInput('')
                setLocalFechaInicio(undefined)
                setLocalFechaFin(undefined)
                setLocalHuespedes(1)
                setLocalMascotas(false)
                setLocalPrecioMax(undefined)
                setLocalOrderBy(undefined)
                setLocalAmenidades(undefined)
              }}
              className="mt-4 text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={14} /> Limpiar todos los filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// FilterChips — chips de filtrado rápido (separado de SearchBar)
// ────────────────────────────────────────────────────────────────────────────
export function FilterChips() {
  const { filtros, setFiltros, resetFiltros } = useSearchStore()
  const router = useRouter()

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* Todos */}
      <button
        type="button"
        onClick={() => { resetFiltros(); router.push('/') }}
        className={cn(
          'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all',
          !filtros.tipo && !filtros.amenidades && !filtros.ciudad
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
          nextFiltros = isActive ? { tipo: undefined } : { tipo: f.tipo }
        } else if ('amenidad' in f) {
          const current = filtros.amenidades?.split(',') ?? []
          isActive = current.includes(f.amenidad)
          const next = isActive ? current.filter((x) => x !== f.amenidad) : [...current, f.amenidad]
          nextFiltros = { amenidades: next.length ? next.join(',') : undefined }
        } else {
          isActive = filtros.ciudad === f.ciudadNombre
          nextFiltros = isActive
            ? { ciudad: undefined }
            : { ciudad: f.ciudadNombre }
        }

        return (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              const merged = { ...filtros, ...nextFiltros }
              setFiltros(nextFiltros)
              router.push(buildUrlFromFiltros(merged))
            }}
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
  )
}
