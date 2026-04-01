'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isBefore, isAfter, isSameDay, addMonths, subMonths,
  getDay, differenceInCalendarDays, parseISO, isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Props {
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  onChange: (start: string, end: string) => void
  blockedDates?: string[]
  minNights?: number
  onClose?: () => void
}

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

function buildMonth(date: Date) {
  const first = startOfMonth(date)
  const last = endOfMonth(date)
  const days = eachDayOfInterval({ start: first, end: last })
  const startOffset = getDay(first) // 0=Sunday
  return { days, startOffset, monthLabel: format(date, 'MMMM yyyy', { locale: es }) }
}

export function DateRangePicker({ startDate, endDate, onChange, blockedDates = [], minNights = 1, onClose }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [baseMonth, setBaseMonth] = useState<Date>(() => {
    if (startDate) {
      const d = parseISO(startDate)
      return startOfMonth(d)
    }
    return startOfMonth(today)
  })

  // Hover state for range preview
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates])

  const month1 = useMemo(() => buildMonth(baseMonth), [baseMonth])
  const month2 = useMemo(() => buildMonth(addMonths(baseMonth, 1)), [baseMonth])

  const startParsed = startDate ? parseISO(startDate) : null
  const endParsed = endDate ? parseISO(endDate) : null

  const isBlocked = (d: Date) =>
    blockedSet.has(format(d, 'yyyy-MM-dd')) || isBefore(d, today)

  const isStart = (d: Date) => startParsed !== null && isSameDay(d, startParsed)
  const isEnd = (d: Date) => endParsed !== null && isSameDay(d, endParsed)

  const isInRange = (d: Date) => {
    const rangeEnd = endParsed || hoverDate
    if (!startParsed || !rangeEnd) return false
    const lo = isBefore(startParsed, rangeEnd) ? startParsed : rangeEnd
    const hi = isBefore(startParsed, rangeEnd) ? rangeEnd : startParsed
    return isAfter(d, lo) && isBefore(d, hi)
  }

  const handleDayClick = (d: Date) => {
    if (isBlocked(d)) return
    const fmtD = format(d, 'yyyy-MM-dd')

    // Si no hay inicio, o ya hay rango completo → empieza nuevo rango
    if (!startDate || (startDate && endDate)) {
      onChange(fmtD, '')
      return
    }

    // Tenemos inicio sin fin → establece fin
    if (startDate && !endDate) {
      if (isBefore(d, parseISO(startDate))) {
        // Fecha antes del inicio → resetea
        onChange(fmtD, '')
        return
      }
      const nights = differenceInCalendarDays(d, parseISO(startDate))
      if (nights < minNights) return // no cumple mínimo
      onChange(startDate, fmtD)
    }
  }

  const renderDay = (d: Date, key: string) => {
    const blocked = isBlocked(d)
    const start = isStart(d)
    const end = isEnd(d)
    const inRange = isInRange(d)
    const fmt = format(d, 'yyyy-MM-dd')
    const isHov = hoverDate ? isSameDay(d, hoverDate) : false

    return (
      <button
        key={key}
        type="button"
        disabled={blocked}
        onClick={() => handleDayClick(d)}
        onMouseEnter={() => !blocked && setHoverDate(d)}
        onMouseLeave={() => setHoverDate(null)}
        className={cn(
          'relative w-full aspect-square flex items-center justify-center text-sm rounded-full transition-all select-none',
          blocked && 'text-stone-300 cursor-not-allowed line-through',
          !blocked && !start && !end && !inRange && 'hover:bg-stone-100 text-stone-700',
          inRange && !start && !end && 'bg-emerald-50 rounded-none text-stone-700',
          (start || end) && 'bg-brand text-white font-semibold z-10',
          isHov && !blocked && !start && !end && 'bg-stone-200',
          isToday(d) && !start && !end && !inRange && 'font-bold underline',
        )}
        title={blocked ? 'No disponible' : fmt}
      >
        {format(d, 'd')}
      </button>
    )
  }

  const renderMonth = (month: ReturnType<typeof buildMonth>) => (
    <div className="flex-1 min-w-0">
      <p className="text-center text-sm font-semibold text-stone-800 mb-3 capitalize">
        {month.monthLabel}
      </p>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs text-stone-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {/* Offset vacío para el primer día */}
        {Array.from({ length: month.startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {month.days.map((d) => renderDay(d, format(d, 'yyyy-MM-dd')))}
      </div>
    </div>
  )

  const nightsLabel = () => {
    if (!startDate || !endDate) return null
    const n = differenceInCalendarDays(parseISO(endDate), parseISO(startDate))
    if (n <= 0) return null
    return `${n} ${n === 1 ? 'noche' : 'noches'}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-stone-600">
          {!startDate && <span className="text-stone-400">Selecciona fecha de llegada</span>}
          {startDate && !endDate && <span className="text-brand-light font-medium">Ahora selecciona la salida</span>}
          {startDate && endDate && (
            <span className="font-medium text-stone-800">
              {format(parseISO(startDate), 'd MMM', { locale: es })} →{' '}
              {format(parseISO(endDate), 'd MMM', { locale: es })}
              {nightsLabel() && <span className="text-stone-400 font-normal"> · {nightsLabel()}</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => onChange('', '')}
              className="text-xs text-stone-400 hover:text-stone-700 underline"
            >
              Limpiar
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setBaseMonth((m) => subMonths(m, 1))}
          disabled={!isBefore(today, baseMonth)}
          className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setBaseMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendars */}
      <div className="flex gap-6">
        {renderMonth(month1)}
        <div className="hidden sm:block w-px bg-stone-100" />
        <div className="hidden sm:flex flex-1">
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
