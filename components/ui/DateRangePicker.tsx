'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isBefore, isAfter, isSameDay, addMonths, subMonths,
  getDay, differenceInCalendarDays, parseISO, isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
  blockedDates?: string[]
  minNights?: number
  onClose?: () => void
}

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

function buildMonth(date: Date) {
  const first = startOfMonth(date)
  const last  = endOfMonth(date)
  const days  = eachDayOfInterval({ start: first, end: last })
  return { days, startOffset: getDay(first), label: format(date, 'MMMM yyyy', { locale: es }) }
}

export function DateRangePicker({ startDate, endDate, onChange, blockedDates = [], minNights = 1, onClose }: Props) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const [baseMonth, setBaseMonth] = useState<Date>(() =>
    startDate ? startOfMonth(parseISO(startDate)) : startOfMonth(today)
  )
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])
  const month1 = useMemo(() => buildMonth(baseMonth), [baseMonth])
  const month2 = useMemo(() => buildMonth(addMonths(baseMonth, 1)), [baseMonth])

  const startParsed = startDate ? parseISO(startDate) : null
  const endParsed   = endDate   ? parseISO(endDate)   : null

  const isBlocked = (d: Date) => blockedSet.has(format(d, 'yyyy-MM-dd')) || isBefore(d, today)

  const isInRange = (d: Date) => {
    const rangeEnd = endParsed || hoverDate
    if (!startParsed || !rangeEnd) return false
    const lo = isBefore(startParsed, rangeEnd) ? startParsed : rangeEnd
    const hi = isBefore(startParsed, rangeEnd) ? rangeEnd   : startParsed
    return isAfter(d, lo) && isBefore(d, hi)
  }

  const handleClick = (d: Date) => {
    if (isBlocked(d)) return
    const fmt = format(d, 'yyyy-MM-dd')
    if (!startDate || (startDate && endDate)) { onChange(fmt, ''); return }
    if (isBefore(d, parseISO(startDate))) { onChange(fmt, ''); return }
    if (differenceInCalendarDays(d, parseISO(startDate)) < minNights) return
    onChange(startDate, fmt)
  }

  const nightsLabel = () => {
    if (!startDate || !endDate) return null
    const n = differenceInCalendarDays(parseISO(endDate), parseISO(startDate))
    return n > 0 ? `${n} ${n === 1 ? 'noche' : 'noches'}` : null
  }

  const renderDay = (d: Date) => {
    const blocked = isBlocked(d)
    const isStart = startParsed ? isSameDay(d, startParsed) : false
    const isEnd   = endParsed   ? isSameDay(d, endParsed)   : false
    const inRange = isInRange(d)
    const isHov   = hoverDate   ? isSameDay(d, hoverDate)   : false

    // Para el rango: mostrar media franja a la derecha del inicio y a la izquierda del fin
    const rangeEnd = endParsed || hoverDate
    const hasRange = startParsed && rangeEnd && !isSameDay(startParsed, rangeEnd ?? startParsed)
    const showRightHalf = isStart && hasRange && (rangeEnd ? isAfter(rangeEnd, startParsed) : false)
    const showLeftHalf  = isEnd   && hasRange

    return (
      <div
        key={format(d, 'yyyy-MM-dd')}
        className="relative flex items-center justify-center h-9"
        onMouseEnter={() => !blocked && setHoverDate(d)}
        onMouseLeave={() => setHoverDate(null)}
      >
        {/* Franja derecha para inicio del rango */}
        {showRightHalf && (
          <div className="absolute top-0.5 bottom-0.5 left-1/2 right-0 bg-stone-100 pointer-events-none" />
        )}
        {/* Franja izquierda para fin del rango */}
        {showLeftHalf && (
          <div className="absolute top-0.5 bottom-0.5 right-1/2 left-0 bg-stone-100 pointer-events-none" />
        )}
        {/* Franja completa para días intermedios */}
        {inRange && !isStart && !isEnd && (
          <div className="absolute top-0.5 bottom-0.5 left-0 right-0 bg-stone-100 pointer-events-none" />
        )}

        <button
          type="button"
          disabled={blocked}
          onClick={() => handleClick(d)}
          className={[
            'relative z-10 w-9 h-9 shrink-0 flex items-center justify-center text-sm rounded-full transition-colors select-none',
            blocked
              ? 'text-stone-300 cursor-not-allowed line-through'
              : (isStart || isEnd)
              ? 'bg-stone-900 text-white font-semibold'
              : isHov && !startDate
              ? 'bg-stone-200 text-stone-800'
              : inRange || isHov
              ? 'hover:bg-stone-200 text-stone-700'
              : isToday(d)
              ? 'font-bold text-emerald-600 hover:bg-stone-100'
              : 'hover:bg-stone-100 text-stone-700',
          ].join(' ')}
        >
          {format(d, 'd')}
        </button>
      </div>
    )
  }

  const renderMonth = (month: ReturnType<typeof buildMonth>) => (
    <div className="flex-1 min-w-0 overflow-hidden">
      <p className="text-center text-sm font-semibold text-stone-800 mb-3 capitalize">
        {month.label}
      </p>
      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="h-9 flex items-center justify-center text-xs text-stone-400 font-medium">
            {d}
          </div>
        ))}
      </div>
      {/* Días del mes */}
      <div className="grid grid-cols-7">
        {Array.from({ length: month.startOffset }).map((_, i) => <div key={`e${i}`} className="h-9" />)}
        {month.days.map((d) => renderDay(d))}
      </div>
    </div>
  )

  const canPrev = isBefore(today, baseMonth)

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 w-full">
      {/* Header — estado de selección */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm">
          {!startDate && <span className="text-stone-400">Selecciona tu fecha de llegada</span>}
          {startDate && !endDate && <span className="text-emerald-600 font-medium">Selecciona tu fecha de salida</span>}
          {startDate && endDate && (
            <span className="font-medium text-stone-800">
              {format(parseISO(startDate), 'd MMM', { locale: es })} →{' '}
              {format(parseISO(endDate),   'd MMM', { locale: es })}
              {nightsLabel() && <span className="text-stone-400 font-normal"> · {nightsLabel()}</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(startDate || endDate) && (
            <button type="button" onClick={() => onChange('', '')} className="text-xs text-stone-400 hover:text-stone-700 underline">
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

      {minNights > 1 && (
        <p className="mt-3 text-xs text-stone-400 text-center">
          Mínimo {minNights} {minNights === 1 ? 'noche' : 'noches'}
        </p>
      )}
    </div>
  )
}
