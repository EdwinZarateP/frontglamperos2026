'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCOP } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { trackPurchase, buildPurchaseItemFromReserva } from '@/lib/analytics'
import type { Reserva } from '@/types'

interface EstadoPago {
  reservaId: string
  estadoReserva: string
  montoPagado: number
  saldoPendiente: number
  pagadoCompleto: boolean
  reserva?: Reserva
}

export function PagoResultadoClient() {
  const searchParams = useSearchParams()
  const reservaId = searchParams.get('reservaId') || searchParams.get('id')
  const [estado, setEstado] = useState<EstadoPago | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reservaId) { setLoading(false); return }
    const check = async () => {
      try {
        const res = await api.get(`/pagos/wompi/estado/${reservaId}`)
        setEstado(res.data)

        // Enviar evento purchase a GA4 cuando el pago es exitoso
        const esExitoso = res.data.pagadoCompleto || (res.data.montoPagado ?? 0) > 0
        if (esExitoso && res.data.reservaId) {
          console.log('[PagoResultado] Pago exitoso, obteniendo reserva para evento purchase:', res.data.reservaId)
          try {
            // Obtener la reserva completa para tener los datos del glamping
            const reservaRes = await api.get<Reserva>(`/reservas/${res.data.reservaId}`)
            const reserva = reservaRes.data

            console.log('[PagoResultado] Enviando evento purchase completo:', reserva._id, 'valor:', res.data.montoPagado || reserva.precioTotal)
            trackPurchase({
              transaction_id: reserva._id || res.data.reservaId,
              value: res.data.montoPagado || reserva.precioTotal || 0,
              currency: 'COP',
              items: [buildPurchaseItemFromReserva(reserva)],
            })
          } catch (err) {
            console.error('[PagoResultado] Error al obtener reserva para evento purchase:', err)
            // Enviar evento purchase básico aunque no tengamos los datos completos
            if (window.gtag) {
              const adwordsId = process.env.NEXT_PUBLIC_GA4_ADWORDS_CONVERSION_ID || '17234612701'
              const adwordsLabel = process.env.NEXT_PUBLIC_GA4_ADWORDS_CONVERSION_LABEL || 'iUXpCLu7ktQbEN2jjZpA'
              const conversionLabel = `AW-${adwordsId}/${adwordsLabel}`

              window.gtag('event', 'conversion', {
                send_to: conversionLabel,
                transaction_id: res.data.reservaId,
                value: res.data.montoPagado || 0,
                currency: 'COP',
              })
              console.log('[PagoResultado] Evento conversion básico enviado:', conversionLabel)
            }
          }
        }
      } catch (err) {
        console.error('[PagoResultado] Error al verificar estado del pago:', err)
        // Si falla, enviar evento purchase con el ID que viene de la URL
        if (reservaId && window.gtag) {
          const adwordsId = process.env.NEXT_PUBLIC_GA4_ADWORDS_CONVERSION_ID || '17234612701'
          const adwordsLabel = process.env.NEXT_PUBLIC_GA4_ADWORDS_CONVERSION_LABEL || 'iUXpCLu7ktQbEN2jjZpA'
          const conversionLabel = `AW-${adwordsId}/${adwordsLabel}`

          window.gtag('event', 'conversion', {
            send_to: conversionLabel,
            transaction_id: reservaId,
          })
          console.log('[PagoResultado] Evento conversion básico enviado (desde URL):', reservaId, conversionLabel)
        }
      } finally {
        setLoading(false)
      }
    }
    setTimeout(check, 2000)
  }, [reservaId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner className="py-4" />
        <p className="text-stone-500 mt-2">Verificando tu pago...</p>
      </div>
    </div>
  )

  const exito = estado?.pagadoCompleto || (estado?.montoPagado ?? 0) > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-10 max-w-md w-full text-center">
        {exito ? (
          <>
            <CheckCircle size={56} className="text-brand mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">¡Pago recibido!</h1>
            <p className="text-stone-500 mb-6">
              Tu pago fue procesado exitosamente. El administrador confirmará tu reserva pronto.
            </p>
            {estado && (
              <div className="bg-stone-50 rounded-xl p-4 mb-6 text-sm text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">Monto pagado</span>
                  <span className="font-semibold">{formatCOP(estado.montoPagado)}</span>
                </div>
                {(estado.saldoPendiente ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Saldo al llegar</span>
                    <span className="font-semibold text-amber-600">{formatCOP(estado.saldoPendiente)}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <Clock size={56} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-stone-900 mb-2">Pago en proceso</h1>
            <p className="text-stone-500 mb-6">
              Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/mis-reservas">
            <Button fullWidth>Ver mis reservas</Button>
          </Link>
          <Link href="/">
            <Button fullWidth variant="ghost">Ir al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
