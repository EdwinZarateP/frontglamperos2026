'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isBefore, isSameDay, addMonths, subMonths,
  getDay, parseISO, isToday, isWeekend,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  value: string
  onChange: (date: string) => void
  blockedDates?: string[]
  holidays?: Set<string>
  onClose?: () => void
  /** Precio pasadía entre semana (COP) */
  precioDiaSemana?: number
  /** Precio pasadía fin de semana y festivos (COP) */
  precioFinDeSemana?: number
}

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function buildMonth(date: Date) {
  const first = startOfMonth(date)
  const last  = endOfMonth(date)
  const days  = eachDayOfInterval({ start: first, end: last })
  return { days, startOffset: (getDay(first) + 6) % 7, label: format(date, 'MMMM yyyy', { locale: es }) }
}

function formatCOP(v: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)
}

export function SingleDatePicker({ value, onChange, blockedDates = [], holidays, onClose, precioDiaSemana, precioFinDeSemana }: Props) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const [baseMonth, setBaseMonth] = useState<Date>(() =>
    value ? startOfMonth(parseISO(value)) : startOfMonth(today)
  )

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])
  const month1 = useMemo(() => buildMonth(baseMonth), [baseMonth])
  const month2 = useMemo(() => buildMonth(addMonths(baseMonth, 1)), [baseMonth])

  const selected = value ? parseISO(value) : null

  const isBlocked = (d: Date) => blockedSet.has(format(d, 'yyyy-MM-dd')) || isBefore(d, today)

  const handleClick = (d: Date) => {
    if (isBlocked(d)) return
    const fmt = format(d, 'yyyy-MM-dd')
    onChange(fmt === value ? '' : fmt)
  }

  const renderDay = (d: Date) => {
    const blocked    = isBlocked(d)
    const isSelected = selected ? isSameDay(d, selected) : false
    const dateStr    = format(d, 'yyyy-MM-dd')
    const isFestivo  = holidays?.has(dateStr) ?? false
    const tarifaAlta = isWeekend(d) || isFestivo

    return (
      <div key={dateStr} className="relative flex items-center justify-center h-9">
        <button
          type="button"
          disabled={blocked}
          onClick={() => handleClick(d)}
          title={
            !blocked
              ? tarifaAlta
                ? (precioFinDeSemana ? `Fin de semana / festivo · ${formatCOP(precioFinDeSemana)}` : 'Fin de semana / festivo')
                : (precioDiaSemana ? `Entre semana · ${formatCOP(precioDiaSemana)}` : 'Entre semana')
              : undefined
          }
          className={[
            'relative z-10 w-9 h-9 shrink-0 flex items-center justify-center text-sm rounded-full transition-colors select-none',
            blocked
              ? 'text-stone-300 cursor-not-allowed line-through'
              : isSelected
              ? 'bg-stone-900 text-white font-semibold'
              : tarifaAlta
              ? isToday(d)
                ? 'font-bold text-amber-500 hover:bg-amber-50'
                : 'text-amber-600 hover:bg-amber-50'
              : isToday(d)
              ? 'font-bold text-emerald-600 hover:bg-stone-100'
              : 'hover:bg-stone-100 text-stone-700',
          ].join(' ')}
        >
          {format(d, 'd')}
          {isFestivo && !isWeekend(d) && (
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
          )}
        </button>
      </div>
    )
  }

  const renderMonth = (month: ReturnType<typeof buildMonth>) => (
    <div className="flex-1 min-w-0 overflow-hidden">
      <p className="text-center text-sm font-semibold text-stone-800 mb-3 capitalize">
        {month.label}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="h-9 flex items-center justify-center text-xs text-stone-400 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: month.startOffset }).map((_, i) => <div key={`e${i}`} className="h-9" />)}
        {month.days.map((d) => renderDay(d))}
      </div>
    </div>
  )

  const canPrev = isBefore(today, baseMonth)

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">
          {!value
            ? <span className="text-stone-400">Selecciona la fecha del pasadía</span>
            : <span className="font-medium text-stone-800">
                {format(parseISO(value), "EEEE d 'de' MMMM", { locale: es })}
              </span>
          }
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-xs text-stone-400 hover:text-stone-700 underline">
              Limpiar
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Leyenda precios */}
      <div className="flex gap-3 text-xs mb-3">
        <span className="flex items-center gap-1 text-stone-500">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-700 inline-block" />
          Entre semana sin festivos{precioDiaSemana ? ` · ${formatCOP(precioDiaSemana)}` : ''}
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          Fines de semana y festivos{precioFinDeSemana ? ` · ${formatCOP(precioFinDeSemana)}` : ' · tarifa noche'}
        </span>
      </div>

      {/* Navegación de meses */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setBaseMonth((m) => subMonths(m, 1))}
          disabled={!canPrev}
          className="p-2 rounded-full hover:bg-stone-100 text-stone-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setBaseMonth((m) => addMonths(m, 1))}
          className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Meses */}
      <div className="flex gap-4">
        {renderMonth(month1)}
        <div className="hidden sm:block w-px bg-stone-100 shrink-0" />
        <div className="hidden sm:flex flex-1 min-w-0">
          {renderMonth(month2)}
        </div>
      </div>

      <p className="mt-3 text-xs text-stone-400 text-center">
        Los días en <span className="text-amber-600 font-medium">naranja</span> son fines de semana y festivos (tarifa noche sábado)
      </p>
    </div>
  )
}
