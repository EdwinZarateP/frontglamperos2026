import { Suspense } from 'react'
import { CallbackClient } from './CallbackClient'
import { Spinner } from '@/components/ui/Spinner'

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <CallbackClient />
    </Suspense>
  )
}
