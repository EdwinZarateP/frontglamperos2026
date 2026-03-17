'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { estadoColors, estadoLabel, formatCOP } from '@/lib/utils'

interface CalendarioEvento {
  glampingId: string
  nombreGlamping: string
  tipo: string
  estado: string
  fechaInicio: string
  fechaFin?: string
  fecha?: string
  nombreTitular: string
  precioTotal: number
  huespedes: number
}

export default function CalendarioAnfitrionPage() {
  const [fecha, setFecha] = useState(new Date())

  const mesStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
  const desde = `${mesStr}-01`
  const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
  const hasta = `${mesStr}-${String(fin.getDate()).padStart(2, '0')}`

  const { data, isLoading } = useQuery<{ data: CalendarioEvento[] }>({
    queryKey: ['calendario-anfitrion', desde, hasta],
    queryFn: async () => {
      const res = await api.get('/reservas/anfitrion/calendario', {
        params: { desde, hasta },
      })
      return res.data
    },
  })

  const eventos = data?.data || []

  const prevMes = () => setFecha((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMes = () => setFecha((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const mesLabel = fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Calendario</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMes} className="p-2 rounded-full hover:bg-stone-100">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-stone-700 capitalize min-w-[160px] text-center">
            {mesLabel}
          </span>
          <button onClick={nextMes} className="p-2 rounded-full hover:bg-stone-100">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-stone-400">Cargando...</div>
      ) : eventos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400">No hay reservas en este período</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((ev, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[ev.estado] || 'bg-stone-100 text-stone-600'}`}>
                      {estadoLabel[ev.estado] || ev.estado}
                    </span>
                    <span className="text-xs text-stone-400">{ev.nombreGlamping}</span>
                  </div>
                  <p className="font-semibold text-stone-900">{ev.nombreTitular}</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {ev.tipo === 'NOCHES'
                      ? `${ev.fechaInicio} → ${ev.fechaFin}`
                      : `Pasadía ${ev.fecha}`}
                    {' · '}{ev.huespedes} huéspedes
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-900">{formatCOP(ev.precioTotal)}</p>
                  <p className="text-xs text-stone-400">total</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
