'use client'

import { use, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery as useTanQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCOP } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { WompiIniciarResponse } from '@/types'

export default function PagoPage({ params }: { params: Promise<{ reservaId: string }> }) {
  const { reservaId } = use(params)
  const searchParams = useSearchParams()
  const porcentajeInicial = searchParams.get('porcentaje') === '50' ? 50 : 100
  const [porcentaje, setPorcentaje] = useState<50 | 100>(porcentajeInicial as 50 | 100)
  const [loading, setLoading] = useState(false)

  const { data: wompiData, isLoading } = useTanQuery<WompiIniciarResponse>({
    queryKey: ['wompi', reservaId, porcentaje],
    queryFn: async () => {
      const res = await api.get(`/pagos/wompi/iniciar/${reservaId}`, {
        params: { porcentaje },
      })
      return res.data
    },
  })

  const handlePagar = () => {
    setLoading(true)
    // Redirigir al checkout de Wompi directamente (más confiable que el widget en local)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    window.location.href = `${apiUrl}/pagos/wompi/checkout/${reservaId}?porcentaje=${porcentaje}`
  }

  if (isLoading) return <Spinner />

  if (!wompiData) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-stone-500">No se pudo cargar la información de pago</p>
    </div>
  )

  const { desglose } = wompiData

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Pago en línea</h1>
        <p className="text-stone-400 text-sm mb-8">Procesado de forma segura por Wompi</p>

        {/* Selección de porcentaje */}
        <div className="mb-6">
          <p className="text-sm font-medium text-stone-700 mb-3">¿Cuánto deseas pagar?</p>
          <div className="grid grid-cols-2 gap-3">
            {([50, 100] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPorcentaje(p)}
                className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  porcentaje === p
                    ? 'border-brand bg-emerald-50 text-brand-light'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {p === 50 ? '50% (abono)' : '100% (todo)'}
                <p className="text-xs font-normal mt-1">
                  {p === 50
                    ? formatCOP(desglose.precioTotalReserva / 2 * 1.05)
                    : formatCOP(desglose.totalACobrar)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Desglose */}
        <div className="bg-stone-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between text-stone-600">
            <span>Total de la reserva</span>
            <span>{formatCOP(desglose.precioTotalReserva)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Recargo Wompi (5%)</span>
            <span>{formatCOP(desglose.recargo_wompi_5pct)}</span>
          </div>
          <hr className="border-stone-200" />
          <div className="flex justify-between font-bold text-stone-900">
            <span>A pagar ahora</span>
            <span>{formatCOP(desglose.totalACobrar)}</span>
          </div>
          {desglose.saldoPendienteTrasPago > 0 && (
            <p className="text-xs text-amber-600">
              Saldo restante al llegar: {formatCOP(desglose.saldoPendienteTrasPago)}
            </p>
          )}
        </div>

        <p className="text-xs text-stone-400 mb-4 text-center">
          El recargo del 5% es cobrado por Wompi, no por Glamperos.
          Puedes pagar con tarjeta débito, crédito, PSE o Nequi.
        </p>

        <Button fullWidth size="lg" onClick={handlePagar} loading={loading}>
          Pagar {formatCOP(desglose.totalACobrar)} con Wompi
        </Button>

        <div className="flex items-center justify-center gap-2 mt-4">
          <img src="https://wompi.co/wp-content/uploads/2022/08/logo-wompi.svg" alt="Wompi" className="h-5 opacity-60" />
          <span className="text-xs text-stone-300">|</span>
          <span className="text-xs text-stone-400">Pago 100% seguro</span>
        </div>
      </div>
    </div>
  )
}
