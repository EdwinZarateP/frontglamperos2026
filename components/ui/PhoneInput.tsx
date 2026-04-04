'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Country {
  name: string
  flag: string
  dial: string
}

const COUNTRIES: Country[] = [
  { name: 'Colombia',           flag: '🇨🇴', dial: '+57'   },
  { name: 'Argentina',          flag: '🇦🇷', dial: '+54'   },
  { name: 'Bolivia',            flag: '🇧🇴', dial: '+591'  },
  { name: 'Brasil',             flag: '🇧🇷', dial: '+55'   },
  { name: 'Canadá',             flag: '🇨🇦', dial: '+1'    },
  { name: 'Chile',              flag: '🇨🇱', dial: '+56'   },
  { name: 'Costa Rica',         flag: '🇨🇷', dial: '+506'  },
  { name: 'Cuba',               flag: '🇨🇺', dial: '+53'   },
  { name: 'Ecuador',            flag: '🇪🇨', dial: '+593'  },
  { name: 'El Salvador',        flag: '🇸🇻', dial: '+503'  },
  { name: 'España',             flag: '🇪🇸', dial: '+34'   },
  { name: 'Estados Unidos',     flag: '🇺🇸', dial: '+1'    },
  { name: 'Francia',            flag: '🇫🇷', dial: '+33'   },
  { name: 'Alemania',           flag: '🇩🇪', dial: '+49'   },
  { name: 'Guatemala',          flag: '🇬🇹', dial: '+502'  },
  { name: 'Honduras',           flag: '🇭🇳', dial: '+504'  },
  { name: 'Italia',             flag: '🇮🇹', dial: '+39'   },
  { name: 'México',             flag: '🇲🇽', dial: '+52'   },
  { name: 'Nicaragua',          flag: '🇳🇮', dial: '+505'  },
  { name: 'Panamá',             flag: '🇵🇦', dial: '+507'  },
  { name: 'Paraguay',           flag: '🇵🇾', dial: '+595'  },
  { name: 'Perú',               flag: '🇵🇪', dial: '+51'   },
  { name: 'Portugal',           flag: '🇵🇹', dial: '+351'  },
  { name: 'Rep. Dominicana',    flag: '🇩🇴', dial: '+1809' },
  { name: 'Reino Unido',        flag: '🇬🇧', dial: '+44'   },
  { name: 'Uruguay',            flag: '🇺🇾', dial: '+598'  },
  { name: 'Venezuela',          flag: '🇻🇪', dial: '+58'   },
]

const DEFAULT = COUNTRIES[0] // Colombia

interface Props {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
}

export function PhoneInput({ value, onChange, error, label }: Props) {
  const [selected, setSelected] = useState<Country>(DEFAULT)
  const [localNumber, setLocalNumber] = useState('')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Inicializar desde value externo (ej: pre-fill desde el usuario)
  useEffect(() => {
    if (!value) return
    const match = COUNTRIES.find((c) => value.startsWith(c.dial))
    if (match) {
      setSelected(match)
      setLocalNumber(value.slice(match.dial.length))
    } else {
      setLocalNumber(value)
    }
  }, []) // solo en mount

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (country: Country) => {
    setSelected(country)
    setOpen(false)
    setSearch('')
    onChange(country.dial + localNumber)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s\-]/g, '')
    setLocalNumber(num)
    onChange(selected.dial + num)
  }

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search)
      )
    : COUNTRIES

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}

      <div className="relative flex" ref={dropdownRef}>
        {/* Botón indicativo */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 rounded-l-xl border border-r-0 bg-stone-50 hover:bg-stone-100 transition-colors shrink-0 text-sm',
            error ? 'border-red-400' : 'border-stone-300',
            open && 'bg-stone-100'
          )}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-stone-700 font-medium tabular-nums">{selected.dial}</span>
          <ChevronDown size={13} className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Input número */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder="3001234567"
          value={localNumber}
          onChange={handleNumberChange}
          className={cn(
            'flex-1 min-w-0 rounded-r-xl border bg-white px-3 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
            error ? 'border-red-400 focus:ring-red-400' : 'border-stone-300'
          )}
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-stone-200 rounded-xl shadow-lg w-64 overflow-hidden">
            {/* Buscador */}
            <div className="p-2 border-b border-stone-100">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-stone-50 rounded-lg">
                <Search size={13} className="text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar país..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-2 text-xs text-stone-400 text-center">Sin resultados</li>
              )}
              {filtered.map((country) => (
                <li key={country.name + country.dial}>
                  <button
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-stone-50 transition-colors text-left',
                      selected.name === country.name && selected.dial === country.dial && 'bg-emerald-50 text-emerald-700'
                    )}
                  >
                    <span className="text-base leading-none shrink-0">{country.flag}</span>
                    <span className="flex-1 truncate text-stone-700">{country.name}</span>
                    <span className="text-stone-400 tabular-nums shrink-0">{country.dial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
