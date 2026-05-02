'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Spinner } from '@/components/ui/Spinner'

export default function PagoResultadoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reservaId = searchParams.get('reserva')
    const id = searchParams.get('id')
    const env = searchParams.get('env')

    console.log('[PAGO RESULTADO] Params:', { reservaId, id, env })

    // Redirigir a /gracias con los parámetros correctos
    if (reservaId) {
      // Determinar el método de pago basado en los parámetros
      const metodo = id ? 'wompi' : 'transferencia'

      // Redirigir a /gracias
      router.replace(`/gracias?reserva=${reservaId}&metodo=${metodo}`)
    } else {
      // Si no hay reservaId, redirigir a home
      router.replace('/')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-brand-light/20">
      <div className="text-center">
        <Spinner className="py-4" />
        <p className="text-stone-600 mt-4">Procesando tu pago...</p>
      </div>
    </div>
  )
}
