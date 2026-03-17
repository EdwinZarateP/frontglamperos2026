import { Suspense } from 'react'
import { MisReservasClient } from './MisReservasClient'
import { Spinner } from '@/components/ui/Spinner'

export default function MisReservasPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MisReservasClient />
    </Suspense>
  )
}
