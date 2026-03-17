import { Suspense } from 'react'
import { PagoResultadoClient } from './PagoResultadoClient'
import { Spinner } from '@/components/ui/Spinner'

export default function PagoResultadoPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PagoResultadoClient />
    </Suspense>
  )
}
