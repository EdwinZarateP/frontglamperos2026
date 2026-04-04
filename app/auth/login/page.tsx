import { Suspense } from 'react'
import { LoginClient } from './LoginClient'
import { Spinner } from '@/components/ui/Spinner'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
      <LoginClient />
    </Suspense>
  )
}
