'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { CIUDADES_COLOMBIA as MUNICIPIOS_COLOMBIA } from '@/lib/colombia'

interface Props {
  value: string
  onChange: (val: string) => void
  error?: string
}

export function CiudadAutocomplete({ value, onChange, error }: Props) {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sincronizar si el valor externo cambia (ej: restaurar borrador)
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const resultados = query.trim().length < 2
    ? []
    : MUNICIPIOS_COLOMBIA.filter((m) =>
        m.label.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)

  const handleSelect = (opcion: string) => {
    setQuery(opcion)
    onChange(opcion)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium text-stone-700 block mb-1">
        Ciudad / Departamento *
      </label>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder="Ej: La Calera, Cundinamarca"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => { if (query.trim().length >= 2) setOpen(true) }}
          className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            error ? 'border-red-400' : 'border-stone-300'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && resultados.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {resultados.map((opcion) => (
            <li key={opcion.slug}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // evitar blur antes del click
                onClick={() => handleSelect(opcion.label)}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2"
              >
                <MapPin size={12} className="text-stone-400 shrink-0" />
                {opcion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
