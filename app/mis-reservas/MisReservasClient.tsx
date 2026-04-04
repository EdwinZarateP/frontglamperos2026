'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar, MapPin, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP, formatDate, estadoColors, estadoLabel } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { Reserva } from '@/types'
import { useRouter } from 'next/navigation'

export function MisReservasClient() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nuevaReservaId = searchParams.get('nueva')

  const { data, isLoading } = useQuery<{ data: Reserva[]; total: number }>({
    queryKey: ['mis-reservas'],
    queryFn: async () => {
      const res = await api.get('/reservas/me', { params: { limit: 50 } })
      return res.data
    },
    enabled: isAuthenticated,
  })

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  const reservas = data?.data ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mis reservas</h1>

      {nuevaReservaId && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle size={22} className="text-brand shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">¡Solicitud enviada con éxito!</p>
            <p className="text-sm text-brand-light mt-0.5">
              Tu reserva está pendiente de aprobación. Te notificaremos por email y WhatsApp.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : reservas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏕️</p>
          <h2 className="text-xl font-semibold text-stone-700 mb-2">Aún no tienes reservas</h2>
          <p className="text-stone-400 mb-6">Explora los glampings disponibles</p>
          <Link href="/">
            <Button>Explorar glampings</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => (
            <div
              key={reserva._id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row">
                {reserva.glamping?.imagenes?.[0] && (
                  <div className="sm:w-40 h-32 sm:h-auto shrink-0">
                    <img
                      src={reserva.glamping.imagenes[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-stone-900">
                        {reserva.glamping?.nombreGlamping || 'Glamping'}
                      </h3>
                      <p className="text-sm text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        {reserva.glamping?.ciudadDepartamento}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          estadoColors[reserva.estado] || 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {estadoLabel[reserva.estado] || reserva.estado}
                      </span>
                      {reserva.metodoPago === 'wompi' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          💳 Wompi
                        </span>
                      )}
                      {reserva.metodoPago === 'transferencia' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-500 border border-stone-200">
                          🏦 Transferencia
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-stone-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {reserva.tipo === 'NOCHES'
                        ? `${formatDate(reserva.fechaInicio!)} → ${formatDate(reserva.fechaFin!)}`
                        : `Pasadía ${formatDate(reserva.fecha!)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {reserva.huespedes} huéspedes
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-stone-900">
                        Total reserva: {formatCOP(reserva.precioTotal)}
                      </p>
                      {reserva.metodoPago === 'wompi' && reserva.montoPagado > 0 && (
                        <div className="mt-1 space-y-0.5 text-xs">
                          {(() => {
                            const fee = Math.ceil(((reserva.valorUsoWompi ?? 0) / 50)) * 50
                            const cobrado = Math.ceil((reserva.montoPagado + (reserva.valorUsoWompi ?? 0)) / 50) * 50
                            const porcentaje = Math.round(reserva.montoPagado / reserva.precioTotal * 100)
                            return <>
                              <p className="text-blue-600 font-medium">💳 Pagado por Wompi ({porcentaje}% abono)</p>
                              <p className="text-stone-500">· Cobrado por pasarela: <span className="font-medium text-stone-700">{formatCOP(cobrado)}</span></p>
                              <p className="text-stone-500">· Abonado a tu reserva: <span className="font-medium text-stone-700">{formatCOP(reserva.montoPagado)}</span></p>
                              {fee > 0 && <p className="text-stone-400">· Recargo pasarela (5%): {formatCOP(fee)}</p>}
                            </>
                          })()}
                        </div>
                      )}
                      {reserva.saldoPendiente > 0 && (
                        <p className={`text-xs mt-1 font-medium ${reserva.metodoPago === 'wompi' ? 'text-emerald-700' : 'text-amber-600'}`}>
                          {reserva.metodoPago === 'wompi' ? '💵 Saldo a pagar al llegar (efectivo):' : 'Saldo pendiente:'} {formatCOP(reserva.saldoPendiente)}
                        </p>
                      )}
                    </div>
                    {reserva.estado === 'CONFIRMADA' &&
                      reserva.saldoPendiente > 0 && (
                        <p className="text-xs text-stone-400 text-right">
                          Saldo al llegar:<br />
                          <span className="font-semibold text-stone-600">{formatCOP(reserva.saldoPendiente)}</span>
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
