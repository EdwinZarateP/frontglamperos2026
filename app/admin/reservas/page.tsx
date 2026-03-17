'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { formatCOP, formatDate, estadoColors, estadoLabel } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Reserva } from '@/types'

export default function AdminReservasPage() {
  const [estadoFiltro, setEstadoFiltro] = useState('PENDIENTE_APROBACION')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Reserva[]; total: number }>({
    queryKey: ['admin-reservas', estadoFiltro, page],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: 20 }
      if (estadoFiltro) params.estado = estadoFiltro
      const res = await api.get('/reservas/', { params })
      return res.data
    },
  })

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      await api.put(`/reservas/${id}/estado`, { estado })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reservas'] })
      toast.success('Estado actualizado')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const ESTADOS = [
    { value: '', label: 'Todas' },
    { value: 'PENDIENTE_APROBACION', label: 'Pendientes' },
    { value: 'CONFIRMADA', label: 'Confirmadas' },
    { value: 'PAGO_RECIBIDO', label: 'Pago recibido' },
    { value: 'COMPLETADA', label: 'Completadas' },
    { value: 'CANCELADA', label: 'Canceladas' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Reservas</h1>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {ESTADOS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setEstadoFiltro(value); setPage(1) }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              estadoFiltro === value
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-600 border-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {data?.data.map((reserva) => (
            <div
              key={reserva._id}
              className="bg-white rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[reserva.estado]}`}
                    >
                      {estadoLabel[reserva.estado]}
                    </span>
                    <span className="text-xs text-stone-400">#{reserva._id.slice(-8)}</span>
                  </div>

                  <p className="font-semibold text-stone-900">
                    {reserva.nombreTitular}
                    <span className="text-stone-400 font-normal text-sm ml-2">{reserva.emailTitular}</span>
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {reserva.tipo === 'NOCHES'
                      ? `${formatDate(reserva.fechaInicio!)} → ${formatDate(reserva.fechaFin!)}`
                      : `Pasadía ${formatDate(reserva.fecha!)}`}
                    {' · '}{reserva.huespedes} huéspedes
                  </p>

                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span className="font-semibold">Total: {formatCOP(reserva.precioTotal)}</span>
                    <span className="text-stone-400">Abonado: {formatCOP(reserva.montoPagado)}</span>
                    {reserva.saldoPendiente > 0 && (
                      <span className="text-amber-600">Pendiente: {formatCOP(reserva.saldoPendiente)}</span>
                    )}
                  </div>

                  {/* Comisión (solo admin) */}
                  <div className="mt-1 text-xs text-stone-400">
                    Comisión Glamperos: {formatCOP(reserva.comision)} ·
                    Anfitrión recibe: {formatCOP(reserva.montoAnfitrion)}
                  </div>

                  {/* Comprobante */}
                  {reserva.comprobantePago && (
                    <a
                      href={reserva.comprobantePago}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline mt-1 block"
                    >
                      Ver comprobante →
                    </a>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  {reserva.estado === 'PENDIENTE_APROBACION' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => cambiarEstado.mutate({ id: reserva._id, estado: 'CONFIRMADA' })}
                        loading={cambiarEstado.isPending}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => cambiarEstado.mutate({ id: reserva._id, estado: 'CANCELADA' })}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                  {reserva.estado === 'PAGO_RECIBIDO' && (
                    <Button
                      size="sm"
                      onClick={() => cambiarEstado.mutate({ id: reserva._id, estado: 'CONFIRMADA' })}
                    >
                      Confirmar
                    </Button>
                  )}
                  {reserva.estado === 'CONFIRMADA' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cambiarEstado.mutate({ id: reserva._id, estado: 'COMPLETADA' })}
                    >
                      Marcar completada
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {data?.data.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              No hay reservas en este estado
            </div>
          )}

          {/* Paginación */}
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="px-4 py-2 text-sm text-stone-500">
                Página {page} de {Math.ceil(data.total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 20 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
