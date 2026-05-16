import { Suspense } from 'react'
import { CallbackClient } from './CallbackClient'
import { Spinner } from '@/components/ui/Spinner'

// Forzar renderizado dinámico para evitar errores de prerendering
export const dynamic = 'force-dynamic'

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <CallbackClient />
    </Suspense>
  )
}
