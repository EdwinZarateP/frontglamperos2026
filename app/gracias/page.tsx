import { Suspense } from 'react'
import { GraciasClient } from './GraciasClient'
import { Spinner } from '@/components/ui/Spinner'

export default function GraciasPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <GraciasClient />
    </Suspense>
  )
}
