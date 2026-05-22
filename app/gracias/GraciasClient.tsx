'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, PartyPopper, Calendar, Users, MapPin, CreditCard, Banknote } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCOP, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { trackPurchase, buildPurchaseItemFromReserva } from '@/lib/analytics'
import type { Reserva } from '@/types'

interface EstadoReserva {
  reserva: Reserva
  metodoPago: 'transferencia' | 'wompi'
}

export function GraciasClient() {
  const searchParams = useSearchParams()
  const reservaId = searchParams.get('reserva')
  const metodo = searchParams.get('metodo') as 'transferencia' | 'wompi' | null
  const valorUrl = searchParams.get('valor')
  const monedaUrl = searchParams.get('moneda') || 'COP'
  const [estado, setEstado] = useState<EstadoReserva | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseTracked, setPurchaseTracked] = useState(false)

  useEffect(() => {
    if (!reservaId) {
      setLoading(false)
      return
    }

    const fetchReserva = async () => {
      try {
        const res = await api.get<Reserva>(`/reservas/${reservaId}`)
        const reserva = res.data

        setEstado({
          reserva,
          metodoPago: metodo || reserva.metodoPago || 'transferencia',
        })

        if (!purchaseTracked && reserva._id) {
          setPurchaseTracked(true)
          console.log('[Gracias] Enviando evento purchase para reserva:', reserva._id, 'valor:', reserva.precioTotal)
          try {
            trackPurchase({
              transaction_id: reserva._id,
              value: reserva.precioTotal || 0,
              currency: 'COP',
              items: [buildPurchaseItemFromReserva(reserva)],
            })
          } catch (err) {
            console.error('[GA4] Error al enviar evento purchase:', err)
          }
        }
        setLoading(false)
      } catch (err: any) {
        if (err.response?.status === 403) {
          console.log('[Gracias] Usuario no autenticado, usando endpoint público')
          try {
            const resPublico = await api.get<Reserva>(`/reservas/${reservaId}/publico`)
            const reserva = resPublico.data

            setEstado({
              reserva,
              metodoPago: metodo || reserva.metodoPago || 'transferencia',
            })

            if (!purchaseTracked && reserva._id) {
              setPurchaseTracked(true)
              console.log('[Gracias] Enviando evento purchase (endpoint público):', reserva._id, 'valor:', reserva.precioTotal)
              try {
                trackPurchase({
                  transaction_id: reserva._id,
                  value: reserva.precioTotal || 0,
                  currency: 'COP',
                  items: [buildPurchaseItemFromReserva(reserva)],
                })
              } catch (err2) {
                console.error('[GA4] Error al enviar evento purchase:', err2)
              }
            }
          } catch (err2) {
            console.error('[Gracias] Error al obtener reserva pública:', err2)
            setEstado({
              reserva: {} as Reserva,
              metodoPago: metodo || 'transferencia',
            })
          }
        } else {
          console.error('[Gracias] Error al obtener reserva:', err)
          setEstado({
            reserva: {} as Reserva,
            metodoPago: metodo || 'transferencia',
          })
        }

        setLoading(false)
      }
    }

    fetchReserva()
  }, [reservaId, metodo, purchaseTracked])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-brand-light/20 px-4">
        <div className="text-center">
          <Spinner className="py-4" />
          <p className="text-stone-500 mt-2">Cargando tu reserva...</p>
        </div>
      </div>
    )
  }

  const esWompi = estado?.metodoPago === 'wompi'
  const esExitoso = esWompi && (estado?.reserva.estado === 'CONFIRMADA' || estado?.reserva.montoPagado > 0)
  const reserva = estado?.reserva

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-brand-light/20 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden">
          <div className={`bg-gradient-to-r px-8 py-10 ${
            esExitoso
              ? 'from-emerald-500 to-brand text-white'
              : 'from-amber-400 to-orange-400 text-white'
          }`}>
            <div className="flex items-center justify-center mb-4">
              {esExitoso ? (
                <div className="relative">
                  <PartyPopper size={80} className="text-white/90" />
                  <CheckCircle size={32} className="absolute -bottom-2 -right-2 text-white drop-shadow-lg" />
                </div>
              ) : (
                <Clock size={80} className="text-white/90" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-center mb-2">
              {esExitoso ? '¡Pago recibido!' : '¡Reserva enviada!'}
            </h1>
            <p className="text-center text-white/90 text-lg">
              {esExitoso
                ? 'Tu pago fue procesado exitosamente'
                : 'Tu reserva está pendiente de confirmación'}
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className={`rounded-2xl p-5 ${
              esExitoso
                ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-amber-50 border border-amber-100'
            }`}>
              <div className="flex gap-3">
                {esExitoso ? (
                  <CheckCircle size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock size={24} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold mb-1 ${
                    esExitoso ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {esExitoso ? 'Confirmaremos tu reserva pronto' : 'Te notificaremos cuando sea confirmada'}
                  </p>
                  <p className={`text-sm ${
                    esExitoso ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {esExitoso
                      ? 'El administrador revisará tu reserva y recibirás un email de confirmación con los detalles de llegada.'
                      : 'El administrador revisará tu comprobante y te notificará por email y WhatsApp una vez confirmada.'}
                  </p>
                </div>
              </div>
            </div>

            {reserva && reserva._id && (
              <div className="bg-stone-50 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                  <Calendar size={18} className="text-brand" />
                  Detalle de tu reserva
                </h3>

                {reserva.glamping?.imagenes?.[0] && (
                  <div className="flex items-start gap-3 pb-4 border-b border-stone-200">
                    <img
                      src={reserva.glamping.imagenes[0]}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate">
                        {reserva.glamping.nombreGlamping || reserva.nombreGlamping}
                      </p>
                      <p className="text-sm text-stone-500 flex items-center gap-1">
                        <MapPin size={12} />
                        {reserva.glamping.ciudadDepartamento || reserva.ciudadDepartamento}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3 text-stone-600">
                    <Calendar size={16} className="text-stone-400" />
                    <span>
                      {reserva.tipo === 'NOCHES'
                        ? `${formatDate(reserva.fechaInicio!)} → ${formatDate(reserva.fechaFin!)}`
                        : `Pasadía ${formatDate(reserva.fecha!)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-600">
                    <Users size={16} className="text-stone-400" />
                    <span>{reserva.huespedes} huéspedes</span>
                  </div>
                </div>

                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  esWompi
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {esWompi ? (
                    <>
                      <CreditCard size={14} />
                      Pagado con Wompi
                    </>
                  ) : (
                    <>
                      <Banknote size={14} />
                      Transferencia bancaria
                    </>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Total reserva</span>
                    <span className="font-semibold text-stone-900">{formatCOP(reserva.precioTotal)}</span>
                  </div>
                  {reserva.montoPagado > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Pagado ahora</span>
                      <span className={`font-semibold ${esWompi ? 'text-blue-700' : 'text-emerald-700'}`}>
                        {formatCOP(reserva.montoPagado)}
                      </span>
                    </div>
                  )}
                  {(reserva.saldoPendiente ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-500">Saldo al llegar</span>
                      <span className="font-semibold text-amber-600">
                        {formatCOP(reserva.saldoPendiente)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2">¿Qué sigue?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {esExitoso ? (
                  <>
                    <li>• Recibirás un email con la confirmación y detalles de llegada</li>
                    <li>• El anfitrión te contactará si necesita información adicional</li>
                  </>
                ) : (
                  <>
                    <li>• Revisaremos tu comprobante en breve</li>
                    <li>• Te notificaremos por email y WhatsApp cuando se confirme</li>
                  </>
                )}
                <li>• Puedes ver el estado de tu reserva en "Mis reservas"</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link href="/mis-reservas" className="block">
                <Button fullWidth size="lg" className="bg-brand hover:bg-brand-hover text-white">
                  Ver mis reservas
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button fullWidth variant="ghost" size="lg">
                  Explorar más glampings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-stone-400 text-sm mt-6">
          ¿Tienes preguntas? Contáctanos por WhatsApp
        </p>
      </div>
    </div>
  )
}
