'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useFavoritos } from '@/hooks/useGlampings'
import { useAuthStore } from '@/store/authStore'
import { GlampingCard } from '@/components/glamping/GlampingCard'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function FavoritosPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const { data, isLoading } = useFavoritos()

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null

  const glampings = data?.data ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Mis favoritos</h1>

      {isLoading ? (
        <Spinner />
      ) : glampings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">❤️</p>
          <h2 className="text-xl font-semibold text-stone-700 mb-2">
            Aún no tienes favoritos
          </h2>
          <p className="text-stone-400 mb-6">
            Guarda los glampings que más te gusten para encontrarlos fácilmente
          </p>
          <Link href="/">
            <Button>Explorar glampings</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {glampings.map((g) => (
            <GlampingCard key={g.id} glamping={{ ...g, esFavorito: true }} />
          ))}
        </div>
      )}
    </div>
  )
}
