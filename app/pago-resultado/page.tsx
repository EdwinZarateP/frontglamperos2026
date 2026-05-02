import { Suspense } from 'react'
import { PagoResultadoClient } from './PagoResultadoClient'
import { Spinner } from '@/components/ui/Spinner'

export const dynamic = 'force-dynamic'

export default function PagoResultadoPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PagoResultadoClient />
    </Suspense>
  )
}
