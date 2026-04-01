'use client'

import { use, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'

interface TokenData {
  nombreGlamping: string
  nombreTitular: string
  reservaId: string
}

export default function ValorarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [calificacion, setCalificacion] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)

  const { data, isLoading, error } = useQuery<TokenData>({
    queryKey: ['calificacion-token', token],
    queryFn: async () => {
      const res = await api.get(`/calificaciones/valorar/${token}`)
      return res.data
    },
  })

  const enviarMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/calificaciones/valorar/${token}`, { calificacion, comentario })
    },
    onSuccess: () => {
      setEnviado(true)
      toast.success('¡Gracias por tu calificación!')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-5xl mb-4">⏰</p>
        <h2 className="text-xl font-semibold text-stone-700 mb-2">
          Este enlace no es válido o ya fue usado
        </h2>
        <p className="text-stone-400">Los links de calificación son de un solo uso y expiran en 30 días.</p>
      </div>
    </div>
  )

  if (enviado) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-6xl mb-4">⭐</p>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">¡Muchas gracias!</h2>
        <p className="text-stone-500">Tu opinión ayuda a otros viajeros a elegir mejor.</p>
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={24}
              className={i < calificacion ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}
            />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold">
            <span className="text-brand">Glamp</span>
            <span className="text-stone-800">eros</span>
          </span>
          <h1 className="text-xl font-semibold text-stone-900 mt-4">
            ¿Cómo estuvo tu experiencia?
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Hola {data?.nombreTitular}, cuéntanos sobre{' '}
            <strong>{data?.nombreGlamping}</strong>
          </p>
        </div>

        {/* Estrellas */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 5 }).map((_, i) => {
            const val = i + 1
            return (
              <button
                key={i}
                onMouseEnter={() => setHover(val)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setCalificacion(val)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={40}
                  className={
                    val <= (hover || calificacion)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-200'
                  }
                />
              </button>
            )
          })}
        </div>

        {calificacion > 0 && (
          <p className="text-center text-sm font-medium text-stone-600 mb-4">
            {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][calificacion]}
          </p>
        )}

        <Textarea
          label="Tu comentario (opcional)"
          placeholder="Cuéntanos los detalles de tu experiencia..."
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />

        <div className="mt-6">
          <Button
            fullWidth
            size="lg"
            onClick={() => enviarMutation.mutate()}
            loading={enviarMutation.isPending}
            disabled={calificacion === 0}
          >
            Enviar calificación
          </Button>
        </div>
      </div>
    </div>
  )
}
