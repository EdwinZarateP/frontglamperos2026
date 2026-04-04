'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, Users, Calendar, MapPin, Dog,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react'
import {
  addMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isBefore, isAfter, isWithinInterval, startOfDay,
  getDay, format, parseISO, isWeekend,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { useSearchStore } from '@/store/searchStore'
import { cn, formatCOP, colombianHolidays } from '@/lib/utils'
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
  | { key: string; label: string; icon: React.ReactNode; mascotas: true }

const FILTROS_RAPIDOS: FiltroChip[] = [
  { key: 'bogota',     label: 'Bogotá',     icon: <img src={`${GCS}/icono%20Bogota2.svg`}      width={20} height={20} alt="" />, ciudadNombre: 'Bogotá, Cundinamarca' },
  { key: 'medellin',   label: 'Medellín',   icon: <img src={`${GCS}/icono%20Medellin%201.svg`} width={20} height={20} alt="" />, ciudadNombre: 'Medellín, Antioquia' },
  { key: 'domo',       label: 'Domo',       icon: <TipoGlampingIcon tipo="domo"       size={20} />, tipo: 'domo' },
  { key: 'cabana',     label: 'Cabaña',     icon: <TipoGlampingIcon tipo="cabana"     size={20} />, tipo: 'cabana' },
  { key: 'chalet',     label: 'Chalet',     icon: <TipoGlampingIcon tipo="chalet"     size={20} />, tipo: 'chalet' },
  { key: 'tiny_house', label: 'Tiny House', icon: <TipoGlampingIcon tipo="tiny_house" size={20} />, tipo: 'tiny_house' },
  { key: 'tipi',       label: 'Tipi',       icon: <TipoGlampingIcon tipo="tipi"       size={20} />, tipo: 'tipi' },
  { key: 'jacuzzi',    label: 'Jacuzzi',    icon: <img src={`${GCS}/icono%20Jacuzzi%201.svg`} width={20} height={20} alt="" />, amenidad: 'jacuzzi' },
  { key: 'piscina',    label: 'Piscina',    icon: <img src={`${GCS}/icono%20Piscina%201.svg`} width={20} height={20} alt="" />, amenidad: 'piscina' },
  { key: 'mascotas',   label: 'Mascotas',   icon: <span className="text-lg leading-none">🐾</span>, mascotas: true as const },
]

function fmtDate(d: string) {
  try { return format(parseISO(d), 'd MMM', { locale: es }) } catch { return d }
}

// ── Calendario estilo Airbnb ──────────────────────────────────────────────────
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const _anoActual = new Date().getFullYear()
const FESTIVOS_CO = new Set([...colombianHolidays(_anoActual), ...colombianHolidays(_anoActual + 1)])

function MesCalendario({
  mes,
  start,
  end,
  hover,
  today,
  onDia,
  onHover,
}: {
  mes: Date
  start: Date | null
  end: Date | null
  hover: Date | null
  today: Date
  onDia: (d: Date) => void
  onHover: (d: Date | null) => void
}) {
  const diasMes = eachDayOfInterval({ start: startOfMonth(mes), end: endOfMonth(mes) })
  const primerDia = (getDay(startOfMonth(mes)) + 6) % 7
  const efectivoFin = end ?? (hover && start && isAfter(hover, start) ? hover : null)

  return (
    <div>
      {/* Nombre del mes */}
      <p className="text-center text-sm font-semibold text-stone-900 mb-3 capitalize">
        {format(mes, 'MMMM yyyy', { locale: es })}
      </p>

      {/* Cabecera días de semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-stone-400 pb-1">{d}</div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7">
        {Array.from({ length: primerDia }).map((_, i) => <div key={`e${i}`} />)}

        {diasMes.map((dia) => {
          const isPast     = isBefore(dia, today) && !isSameDay(dia, today)
          const isStart    = !!start && isSameDay(dia, start)
          const isEnd      = !!end   && isSameDay(dia, end)
          const isHover    = !end && !!hover && !!start && isSameDay(dia, hover) && isAfter(hover, start)
          const inRange    = !!start && !!efectivoFin
                             && isWithinInterval(dia, { start, end: efectivoFin })
                             && !isStart && !(isEnd || isHover)
          const isToday    = isSameDay(dia, today)
          const dateStr    = format(dia, 'yyyy-MM-dd')
          const isFestivo  = FESTIVOS_CO.has(dateStr)
          const tarifaAlta = isWeekend(dia) || isFestivo

          const rangeRight = (isStart || inRange) && !!efectivoFin && !isSameDay(start!, efectivoFin)
          const rangeLeft  = (isEnd || isHover || inRange) && !!start && !!efectivoFin && !isSameDay(start, efectivoFin)

          return (
            <div
              key={dia.toISOString()}
              className="relative flex items-center justify-center h-9"
              onMouseEnter={() => !isPast && onHover(dia)}
              onMouseLeave={() => onHover(null)}
            >
              {rangeRight && <div className="absolute top-0.5 bottom-0.5 left-1/2 right-0 bg-stone-100" />}
              {rangeLeft  && <div className="absolute top-0.5 bottom-0.5 right-1/2 left-0 bg-stone-100" />}

              <button
                type="button"
                onClick={() => !isPast && onDia(dia)}
                disabled={isPast}
                className={cn(
                  'relative z-10 w-9 h-9 shrink-0 flex items-center justify-center text-sm rounded-full transition-colors select-none',
                  isPast  && 'text-stone-300 cursor-not-allowed line-through',
                  !isPast && !isStart && !isEnd && !isHover && tarifaAlta && 'cursor-pointer text-amber-600 hover:bg-amber-50',
                  !isPast && !isStart && !isEnd && !isHover && !tarifaAlta && 'cursor-pointer text-stone-700 hover:bg-stone-200',
                  isToday && !isStart && !isEnd && !isHover && 'font-bold underline underline-offset-2',
                  inRange && 'text-stone-900',
                  (isStart || isEnd) && 'bg-stone-900 text-white font-semibold hover:bg-stone-700',
                  isHover && 'bg-stone-600 text-white font-semibold',
                )}
              >
                {format(dia, 'd')}
                {isFestivo && !isWeekend(dia) && !isPast && !isStart && !isEnd && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  const end   = fechaFin   ? startOfDay(parseISO(fechaFin))   : null

  const handleDia = (dia: Date) => {
    if (!start || (start && end)) {
      onChange(format(dia, 'yyyy-MM-dd'), undefined)
    } else if (isBefore(dia, start) || isSameDay(dia, start)) {
      onChange(format(dia, 'yyyy-MM-dd'), undefined)
    } else {
      onChange(format(start, 'yyyy-MM-dd'), format(dia, 'yyyy-MM-dd'))
    }
  }

  const puedeRetroceder = isAfter(mesActual, startOfMonth(today))

  const sharedProps = { start, end, hover, today, onDia: handleDia, onHover: setHover }

  return (
    <div className="select-none px-5 py-4">

      {/* Cabecera: instrucción + limpiar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">
          {!fechaInicio
            ? 'Selecciona la fecha de llegada'
            : !fechaFin
            ? <span className="font-semibold text-stone-800">Ahora elige la salida</span>
            : <span className="font-medium text-stone-700">{fmtDate(fechaInicio)} → {fmtDate(fechaFin)}</span>
          }
        </p>
        {(fechaInicio || fechaFin) && (
          <button
            type="button"
            onClick={() => onChange(undefined, undefined)}
            className="text-xs font-semibold text-stone-500 underline hover:text-stone-900 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={() => puedeRetroceder && setMesActual((m) => addMonths(m, -1))}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full border transition-colors',
            puedeRetroceder
              ? 'border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'
              : 'border-stone-100 text-stone-200 cursor-not-allowed'
          )}
        >
          <ChevronLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => setMesActual((m) => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors"
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>

      {/* Meses — cada uno en su wrapper flex-1 para que no desborde */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0 overflow-hidden">
          <MesCalendario mes={mesActual} {...sharedProps} />
        </div>
        <div className="hidden sm:block w-px bg-stone-100 shrink-0" />
        <div className="hidden sm:block flex-1 min-w-0 overflow-hidden">
          <MesCalendario mes={mesSiguiente} {...sharedProps} />
        </div>
      </div>
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
  const [showMobile, setShowMobile] = useState(false)
  const [mobileSection, setMobileSection] = useState<'location' | 'dates' | 'guests'>('location')

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

  useEffect(() => { setLocationInput(filtros.ciudad || '') }, [filtros.ciudad])
  useEffect(() => { setLocalFechaInicio(filtros.fecha_inicio) }, [filtros.fecha_inicio])
  useEffect(() => { setLocalFechaFin(filtros.fecha_fin) }, [filtros.fecha_fin])
  useEffect(() => { setLocalHuespedes(filtros.huespedes || 2) }, [filtros.huespedes])
  useEffect(() => { setLocalMascotas(filtros.acepta_mascotas || false) }, [filtros.acepta_mascotas])
  useEffect(() => { setLocalPrecioMax(filtros.precio_max) }, [filtros.precio_max])
  useEffect(() => { setLocalOrderBy(filtros.order_by) }, [filtros.order_by])
  useEffect(() => { setLocalAmenidades(filtros.amenidades) }, [filtros.amenidades])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePanel(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (activePanel === 'location') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [activePanel])

  const togglePanel = (panel: Panel) =>
    setActivePanel((p) => (p === panel ? null : panel))

  const ciudadesFiltradas = locationInput.trim().length >= 2
    ? CIUDADES_COLOMBIA.filter((c) =>
        c.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .includes(locationInput.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      ).slice(0, 8)
    : []

  const selectCity = (ciudad: string, departamento: string, label: string) => {
    setLocationInput(label)
    setActivePanel('dates')
  }

  const handleSearch = () => {
    const input = locationInput.trim()
    const foundCity = input
      ? CIUDADES_COLOMBIA.find(c => c.label === input || c.ciudad.toLowerCase() === input.toLowerCase())
      : null
    const ciudadLabel = foundCity?.label ?? (input || undefined)
    const coords = foundCity ? getCoordenadas(foundCity.ciudad, foundCity.departamento) : null

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

  const CIUDADES_SUGERIDAS = [
    { key: 'bogota',   label: 'Bogotá',   sub: 'Cundinamarca', ciudad: 'Bogotá',   departamento: 'Cundinamarca', icon: `${GCS}/icono%20Bogota2.svg` },
    { key: 'medellin', label: 'Medellín', sub: 'Antioquia',    ciudad: 'Medellín', departamento: 'Antioquia',    icon: `${GCS}/icono%20Medellin%201.svg` },
  ]

  const selectMobileCity = (ciudad: string, departamento: string, label: string) => {
    setLocationInput(label)
    const coords = getCoordenadas(ciudad, departamento)
    const merged = {
      ...filtros,
      ciudad: label,
      lat: coords?.lat,
      lng: coords?.lng,
      radio_km: coords ? 130 : undefined,
    }
    setFiltros(merged)
    setMobileSection('dates')
  }

  const handleMobileSearch = () => {
    const input = locationInput.trim()
    const foundCity = input
      ? CIUDADES_COLOMBIA.find(c => c.label === input || c.ciudad.toLowerCase() === input.toLowerCase())
      : null
    const coords = foundCity ? getCoordenadas(foundCity.ciudad, foundCity.departamento) : null
    const merged = {
      ...filtros,
      ciudad:          input || undefined,
      lat:             coords?.lat,
      lng:             coords?.lng,
      radio_km:        coords ? 130 : undefined,
      fecha_inicio:    localFechaInicio,
      fecha_fin:       localFechaFin,
      huespedes:       localHuespedes > 2 ? localHuespedes : undefined,
      acepta_mascotas: localMascotas || undefined,
    }
    setFiltros(merged)
    setShowMobile(false)
    router.push(buildUrlFromFiltros(merged))
  }

  return (
    <>
      {/* Overlay oscuro detrás del buscador cuando hay un panel activo (solo desktop) */}
      {activePanel && (
        <div
          className="hidden sm:block fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setActivePanel(null)}
        />
      )}

    <div ref={containerRef} className="w-full relative z-40" style={{ isolation: 'isolate' }}>

      <button
        type="button"
        onClick={() => { setShowMobile(true); setMobileSection('location') }}
        className="sm:hidden w-full flex items-center gap-3 bg-white rounded-full shadow-md border border-stone-200 px-4 py-3"
      >
        <Search size={16} className="text-stone-600 shrink-0" />
        <span className={locationInput ? 'text-stone-800 text-sm font-medium truncate' : 'text-stone-400 text-sm'}>
          {locationInput || 'Empieza tu búsqueda'}
        </span>
      </button>

      {showMobile && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setShowMobile(false)}>
          <div
            className="absolute inset-x-0 top-0 bg-white rounded-b-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-stone-100">
              <button
                type="button"
                onClick={() => setShowMobile(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100"
              >
                <X size={18} className="text-stone-600" />
              </button>
              <span className="text-sm font-semibold text-stone-700">Busca tu glamping</span>
            </div>

            <div className="border-b border-stone-100">
              <button
                type="button"
                onClick={() => setMobileSection(s => s === 'location' ? 'dates' : 'location')}
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <span className="text-lg font-bold text-stone-900">¿Dónde?</span>
                <span className="text-sm text-stone-400">{locationInput || 'Cualquier lugar'}</span>
              </button>

              {mobileSection === 'location' && (
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 border border-stone-300 rounded-xl px-4 py-2.5 mb-4 focus-within:ring-2 focus-within:ring-brand">
                    <Search size={15} className="text-stone-400 shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Explora destinos"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="flex-1 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none"
                      autoFocus
                    />
                    {locationInput && (
                      <button type="button" onClick={() => setLocationInput('')}>
                        <X size={14} className="text-stone-400" />
                      </button>
                    )}
                  </div>

                  {locationInput.trim().length < 2 ? (
                    <div className="space-y-1">
                      {CIUDADES_SUGERIDAS.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => selectMobileCity(c.ciudad, c.departamento, `${c.label}, ${c.sub}`)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-stone-50 text-left"
                        >
                          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                            <img src={c.icon} width={28} height={28} alt="" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-stone-800">{c.label}</p>
                            <p className="text-xs text-stone-400">{c.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-1 max-h-52 overflow-y-auto">
                      {ciudadesFiltradas.map((c) => (
                        <li key={c.slug}>
                          <button
                            type="button"
                            onClick={() => selectMobileCity(c.ciudad, c.departamento, c.label)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 text-left"
                          >
                            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center shrink-0">
                              <MapPin size={14} className="text-brand" />
                            </div>
                            <span className="text-sm text-stone-700">
                              <span className="font-medium">{c.ciudad}</span>
                              <span className="text-stone-400">, {c.departamento}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                      {ciudadesFiltradas.length === 0 && (
                        <p className="text-sm text-stone-400 text-center py-4">Sin resultados</p>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="border-b border-stone-100">
              <button
                type="button"
                onClick={() => setMobileSection(s => s === 'dates' ? 'location' : 'dates')}
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <span className="text-lg font-bold text-stone-900">¿Cuándo?</span>
                <span className="text-sm text-stone-400">{datesLabel || 'Agrega fechas'}</span>
              </button>
              {mobileSection === 'dates' && (
                <div className="pb-4">
                  <CalendarioRango
                    fechaInicio={localFechaInicio}
                    fechaFin={localFechaFin}
                    onChange={(start, end) => {
                      setLocalFechaInicio(start)
                      setLocalFechaFin(end)
                      if (start && end) setMobileSection('guests')
                    }}
                  />
                </div>
              )}
            </div>

            <div className="border-b border-stone-100">
              <button
                type="button"
                onClick={() => setMobileSection(s => s === 'guests' ? 'location' : 'guests')}
                className="w-full flex items-center justify-between px-5 py-4"
              >
                <span className="text-lg font-bold text-stone-900">Quién</span>
                <span className="text-sm text-stone-400">{guestsLabel || 'Agrega huéspedes'}</span>
              </button>
              {mobileSection === 'guests' && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-800">Huéspedes</p>
                      <p className="text-xs text-stone-400">Adultos y niños</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setLocalHuespedes(h => Math.max(1, h - 1))}
                        className="w-8 h-8 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-500">−</button>
                      <span className="w-5 text-center font-semibold text-stone-900">{localHuespedes}</span>
                      <button type="button" onClick={() => setLocalHuespedes(h => Math.min(20, h + 1))}
                        className="w-8 h-8 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-500">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <Dog size={16} className="text-stone-500" />
                      <div>
                        <p className="text-sm font-medium text-stone-800">Mascotas</p>
                        <p className="text-xs text-stone-400">Solo glampings que aceptan</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setLocalMascotas(v => !v)}
                      className={cn('w-11 h-6 rounded-full transition-colors relative shrink-0', localMascotas ? 'bg-brand' : 'bg-stone-200')}>
                      <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', localMascotas ? 'left-[22px]' : 'left-0.5')} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setLocationInput('')
                  setLocalFechaInicio(undefined)
                  setLocalFechaFin(undefined)
                  setLocalHuespedes(2)
                  setLocalMascotas(false)
                  resetFiltros()
                }}
                className="text-sm font-semibold text-stone-600 underline"
              >
                Limpiar todo
              </button>
              <button
                type="button"
                onClick={handleMobileSearch}
                className="flex items-center gap-2 bg-stone-900 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-stone-800 transition-colors"
              >
                <Search size={15} />
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden sm:flex bg-white rounded-full shadow-md border border-stone-200 items-center justify-center">

        <div className="relative w-[30%] min-w-[180px]">
          <button
            type="button"
            onClick={() => togglePanel('location')}
            className={cn(
              'w-full flex items-center gap-2 pl-5 pr-3 py-3 text-left transition-colors rounded-l-full',
              activePanel === 'location' ? 'hover:bg-stone-50' : ''
            )}
          >
            <MapPin size={16} className="text-brand shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 hidden sm:block">¿A dónde vas?</p>
              <p className={cn('text-sm truncate', locationInput ? 'text-stone-800 font-medium' : 'text-stone-500')}>
                {locationInput || 'Destino'}
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
                className="cursor-pointer shrink-0"
              >
                <X size={14} className="text-stone-400 hover:text-stone-600" />
              </span>
            )}
          </button>

          {activePanel === 'location' && (
            <div className="absolute top-full left-0 mt-2 w-full sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Destino</p>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ciudad o municipio en Colombia"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand mb-3"
              />
              {ciudadesFiltradas.length > 0 ? (
                <ul className="space-y-1 max-h-52 overflow-y-auto">
                  {ciudadesFiltradas.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onClick={() => selectCity(c.ciudad, c.departamento, c.label)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                      >
                        <MapPin size={13} className="text-brand shrink-0" />
                        <span>
                          <span className="font-medium">{c.ciudad}</span>
                          <span className="text-stone-400">, {c.departamento}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : locationInput.trim().length >= 2 ? (
                <p className="text-sm text-stone-400 text-center py-4">Sin resultados para "{locationInput}"</p>
              ) : (
                <div className="space-y-1">
                  {CIUDADES_SUGERIDAS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => selectCity(c.ciudad, c.departamento, `${c.label}, ${c.sub}`)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                    >
                      <img src={c.icon} width={16} height={16} alt="" className="shrink-0" />
                      <span>
                        <span className="font-medium">{c.label}</span>
                        <span className="text-stone-400">, {c.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-stone-200 shrink-0" />

        <div className="relative w-[25%] min-w-[150px]">
          <button
            type="button"
            onClick={() => togglePanel('dates')}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-3 text-left transition-colors rounded-full',
              activePanel === 'dates' ? 'hover:bg-stone-50' : ''
            )}
          >
            <Calendar size={16} className="text-brand shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 hidden sm:block">Fecha</p>
              <p className={cn('text-sm', datesLabel ? 'text-stone-800 font-medium' : 'text-stone-500')}>
                {datesLabel || 'Fechas'}
              </p>
            </div>
          </button>

          {activePanel === 'dates' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 w-[300px] sm:w-[596px] max-w-[calc(100vw-32px)]">
              <CalendarioRango
                fechaInicio={localFechaInicio}
                fechaFin={localFechaFin}
                onChange={(start, end) => {
                  setLocalFechaInicio(start)
                  setLocalFechaFin(end)
                  if (start && end) setActivePanel('guests')
                }}
              />
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-stone-200 shrink-0" />

        <div className="relative w-[25%] min-w-[130px]">
          <button
            type="button"
            onClick={() => togglePanel('guests')}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-3 text-left transition-colors rounded-full',
              activePanel === 'guests' ? 'hover:bg-stone-50' : ''
            )}
          >
            <Users size={16} className="text-brand shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 hidden sm:block">Viajeros</p>
              <p className={cn('text-sm', guestsLabel ? 'text-stone-800 font-medium' : 'text-stone-500')}>
                {guestsLabel || 'Personas'}
              </p>
            </div>
          </button>

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
                    localMascotas ? 'bg-brand' : 'bg-stone-200'
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
                className="mt-5 w-full py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-light transition-colors"
              >
                Listo
              </button>
            </div>
          )}
        </div>

        <div className="w-[44px] shrink-0">
          <button
            type="button"
            onClick={handleSearch}
            aria-label="Buscar"
            className="w-full h-11 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center transition-colors shadow-sm"
          >
            <Search size={18} className="text-brand" />
          </button>
        </div>
      </div>

    </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// FilterChips — chips de filtrado rápido (separado de SearchBar)
// ────────────────────────────────────────────────────────────────────────────
export function FilterChips() {
  const { filtros, setFiltros, resetFiltros } = useSearchStore()
  const router = useRouter()
  const [showPrice, setShowPrice] = useState(false)
  const [localPrecioMax, setLocalPrecioMax] = useState<number | undefined>(filtros.precio_max)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })
  const priceBtnRef = useRef<HTMLButtonElement>(null)
  const priceRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setLocalPrecioMax(filtros.precio_max) }, [filtros.precio_max])

  useEffect(() => {
    if (!showPrice) return
    const handler = (e: MouseEvent) => {
      if (
        priceRef.current && !priceRef.current.contains(e.target as Node) &&
        priceBtnRef.current && !priceBtnRef.current.contains(e.target as Node)
      ) setShowPrice(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPrice])

  const applyPrice = () => {
    const merged = { ...filtros, precio_max: localPrecioMax }
    setFiltros(merged)
    router.push(buildUrlFromFiltros(merged))
    setShowPrice(false)
  }

  const isPriceActive = !!filtros.precio_max

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide lg:justify-center lg:flex-wrap lg:overflow-x-visible">
      <button
        type="button"
        onClick={() => { resetFiltros(); router.push('/') }}
        className={cn(
          'shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 relative transition-all',
          !filtros.tipo && !filtros.amenidades && !filtros.ciudad
            ? 'text-stone-900'
            : 'text-stone-600 hover:text-stone-900'
        )}
      >
        <span className="h-6 flex items-center justify-center text-lg">🏕️</span>
        <span className="text-xs font-medium">Todos</span>
        {!filtros.tipo && !filtros.amenidades && !filtros.ciudad && (
          <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-stone-800 rounded-full" />
        )}
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
        } else if ('mascotas' in f) {
          isActive = !!filtros.acepta_mascotas
          nextFiltros = { acepta_mascotas: isActive ? undefined : true }
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
              'shrink-0 flex flex-col items-center gap-1 px-4 py-1.5 relative transition-all',
              isActive ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'
            )}
          >
            <span className="h-6 flex items-center justify-center">{f.icon}</span>
            <span className="text-xs font-medium">{f.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-stone-800 rounded-full" />
            )}
          </button>
        )
      })}

      <div className="shrink-0">
        <button
          ref={priceBtnRef}
          type="button"
          onClick={() => {
            if (!showPrice && priceBtnRef.current) {
              const rect = priceBtnRef.current.getBoundingClientRect()
              const panelW = 256
              const left = Math.min(
                Math.max(8, rect.left + rect.width / 2 - panelW / 2),
                window.innerWidth - panelW - 8
              )
              setPanelPos({ top: rect.bottom + 8, left })
            }
            setShowPrice((v) => !v)
          }}
          className={cn(
            'flex flex-col items-center gap-1 px-4 py-1.5 relative transition-all',
            isPriceActive ? 'text-stone-900' : 'text-stone-600 hover:text-stone-900'
          )}
        >
          <span className="h-6 flex items-center justify-center text-lg">💰</span>
          <span className="text-xs font-medium">
            {isPriceActive ? formatCOP(filtros.precio_max!) : 'Precio'}
          </span>
          {isPriceActive && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-stone-800 rounded-full" />
          )}
        </button>

        {showPrice && (
          <div
            ref={priceRef}
            style={{ top: panelPos.top, left: panelPos.left }}
            className="fixed w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 z-50"
          >
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Precio máximo / noche</p>
            <input
              type="range"
              min={100000}
              max={2000000}
              step={50000}
              value={localPrecioMax ?? 2000000}
              onChange={(e) => setLocalPrecioMax(Number(e.target.value))}
              className="w-full accent-brand"
            />
            <p className="text-sm font-semibold text-stone-800 mt-2 text-center">
              {localPrecioMax && localPrecioMax < 2000000 ? formatCOP(localPrecioMax) : 'Sin límite'}
            </p>
            <div className="flex gap-2 mt-3">
              {isPriceActive && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalPrecioMax(undefined)
                    const merged = { ...filtros, precio_max: undefined }
                    setFiltros(merged)
                    router.push(buildUrlFromFiltros(merged))
                    setShowPrice(false)
                  }}
                  className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={applyPrice}
                className="flex-1 py-2 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-light"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}