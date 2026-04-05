'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle2, XCircle } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

interface TokenInfo {
  nombreGlamping: string
  nombreTitular: string
  reservaId: string
}

export default function ValorarPage() {
  const { token } = useParams<{ token: string }>()
  const [info, setInfo]               = useState<TokenInfo | null>(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [tokenError, setTokenError]   = useState('')

  const [estrellas, setEstrellas]       = useState(0)
  const [hover, setHover]               = useState(0)
  const [comentario, setComentario]     = useState('')
  const [enviando, setEnviando]         = useState(false)
  const [enviado, setEnviado]           = useState(false)
  const [submitError, setSubmitError]   = useState('')

  useEffect(() => {
    api.get(`/calificaciones/valorar/${token}`)
      .then(r => setInfo(r.data))
      .catch(e => setTokenError(getErrorMessage(e)))
      .finally(() => setLoadingInfo(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (estrellas === 0) { setSubmitError('Por favor selecciona una calificación.'); return }
    setSubmitError('')
    setEnviando(true)
    try {
      await api.post(`/calificaciones/valorar/${token}`, {
        calificacion: estrellas,
        comentario: comentario.trim() || undefined,
      })
      setEnviado(true)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-10 max-w-sm w-full text-center space-y-4">
          <XCircle className="mx-auto text-red-400" size={48} />
          <h1 className="text-lg font-bold text-stone-900">Link no válido</h1>
          <p className="text-sm text-stone-500">{tokenError}</p>
        </div>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-10 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
          <h1 className="text-xl font-bold text-stone-900">¡Gracias por tu calificación!</h1>
          <p className="text-sm text-stone-500">
            Tu opinión sobre <strong>{info?.nombreGlamping}</strong> fue registrada.
            Nos ayuda a mejorar la experiencia para todos 🙏
          </p>
          <div className="flex justify-center gap-1 pt-1">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={24} className={i <= estrellas ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-md mx-auto space-y-8">

        <div className="text-center space-y-1">
          <p className="text-sm text-stone-400">Hola, {info?.nombreTitular?.split(' ')[0]} 👋</p>
          <h1 className="text-2xl font-bold text-stone-900">¿Cómo fue tu experiencia?</h1>
          <p className="text-stone-500 text-sm">
            Califica tu estadía en <strong>{info?.nombreGlamping}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">

          {/* Estrellas */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setEstrellas(i)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={
                      i <= (hover || estrellas)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-200 fill-stone-200'
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-stone-400 h-5">
              {(hover || estrellas) === 1 && 'Muy malo'}
              {(hover || estrellas) === 2 && 'Malo'}
              {(hover || estrellas) === 3 && 'Regular'}
              {(hover || estrellas) === 4 && 'Bueno'}
              {(hover || estrellas) === 5 && '¡Excelente!'}
            </p>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Comentario <span className="text-stone-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              rows={4}
              placeholder="Cuéntanos qué disfrutaste o qué podría mejorar..."
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <button
            type="submit"
            disabled={enviando || estrellas === 0}
            className="w-full bg-brand text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Enviar calificación'}
          </button>
        </form>
      </div>
    </div>
  )
}
