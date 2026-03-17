'use client'

import { use, useState, useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { CalendarioGrid } from '@/app/anfitrion/calendario/page'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

export default function CalendarioPublicoPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [mes, setMes] = useState(new Date())

  const year  = mes.getFullYear()
  const month = mes.getMonth()

  const { data: glampings = [], isLoading } = useQuery({
    queryKey: ['cal-pub-g', userId],
    queryFn: async () => (await api.get(`/glampings/por_propietario/${userId}`)).data,
  })

  const unidadesQ = useQueries({
    queries: glampings.map((g: { _id: string }) => ({
      queryKey: ['cal-pub-u', g._id],
      queryFn: async (): Promise<[string, unknown[]]> => {
        const { data } = await api.get(`/glampings/${g._id}/unidades`)
        return [g._id, data]
      },
    })),
  })
  const bloqueosQ = useQueries({
    queries: glampings.map((g: { _id: string }) => ({
      queryKey: ['cal-pub-b', g._id],
      queryFn: async (): Promise<[string, unknown[]]> => {
        const { data } = await api.get(`/glampings/${g._id}/bloqueos`)
        return [g._id, data]
      },
    })),
  })

  const unidadesPorGlamping = useMemo(() =>
    Object.fromEntries(unidadesQ.flatMap((q) => q.data ? [q.data as [string, unknown[]]] : [])),
    [unidadesQ]) as Record<string, { _id: string; nombre: string }[]>

  const bloqueosPorGlamping = useMemo(() =>
    Object.fromEntries(bloqueosQ.flatMap((q) => q.data ? [q.data as [string, unknown[]]] : [])),
    [bloqueosQ]) as Record<string, { _id: string; tipo: string; fuente: string; fecha?: string; fechaInicio?: string; fechaFin?: string; unidadId?: string; metadata: Record<string, string> }[]>

  const loading = isLoading || unidadesQ.some((q) => q.isLoading) || bloqueosQ.some((q) => q.isLoading)

  const nombre = glampings[0] ? undefined : null

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {glampings.length > 0 ? 'Disponibilidad' : 'Calendario'}
          </h1>
          <p className="text-sm text-stone-400 mt-1">Consulta las fechas disponibles en tiempo real.</p>
        </div>

        {/* Leyenda */}
        {glampings.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {glampings.map((g: { _id: string; nombreGlamping: string }, i: number) => {
              const PALETA = [
                { dot: 'bg-emerald-500' }, { dot: 'bg-blue-500' }, { dot: 'bg-violet-500' },
                { dot: 'bg-amber-500' },  { dot: 'bg-rose-500' }, { dot: 'bg-cyan-500' },
              ]
              return (
                <div key={g._id} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${PALETA[i % PALETA.length].dot}`} />
                  <span className="text-sm text-stone-600">{g.nombreGlamping}</span>
                </div>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : glampings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
            <p className="text-stone-400">No hay glampings disponibles.</p>
          </div>
        ) : (
          <CalendarioGrid
            glampings={glampings}
            unidadesPorGlamping={unidadesPorGlamping}
            bloqueosPorGlamping={bloqueosPorGlamping}
            year={year}
            month={month}
            onPrevMes={() => setMes(new Date(year, month - 1, 1))}
            onNextMes={() => setMes(new Date(year, month + 1, 1))}
          />
        )}

        <p className="text-center text-xs text-stone-300 pt-4">Powered by Glamperos</p>
      </div>
    </div>
  )
}
