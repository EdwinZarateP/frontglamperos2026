'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react'
import { useGlamping } from '@/hooks/useGlampings'
import { Spinner } from '@/components/ui/Spinner'

export default function FotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()

  const { data: glamping, isLoading } = useGlamping(id)
  const [current, setCurrent] = useState(0)

  // Inicializar en la foto que viene del param ?foto=N
  useEffect(() => {
    const n = Number(searchParams.get('foto') || 0)
    if (!isNaN(n) && n >= 0) setCurrent(n)
  }, [searchParams])

  const imagenes = glamping?.imagenes ?? []
  const total = imagenes.length

  const prev = useCallback(() => setCurrent((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setCurrent((i) => Math.min(total - 1, i + 1)), [total])

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') router.back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, router])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!glamping || !total) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        <p>No hay imágenes disponibles</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col select-none">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm hover:text-stone-300 transition-colors"
        >
          <X size={20} />
          <span className="hidden sm:inline">{glamping.nombreGlamping}</span>
        </button>

        <span className="text-sm font-medium text-stone-300">
          {current + 1} / {total}
        </span>

        <a
          href={imagenes[current]}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:text-stone-300 transition-colors"
          aria-label="Descargar foto"
        >
          <Download size={18} />
        </a>
      </div>

      {/* Imagen principal */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          key={current}
          src={imagenes[current]}
          alt={`${glamping.nombreGlamping} — foto ${current + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{ animation: 'fadeIn .15s ease' }}
        />

        {/* Flecha izquierda */}
        {current > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Flecha derecha */}
        {current < total - 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            aria-label="Foto siguiente"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Miniaturas */}
      <div className="shrink-0 py-3 px-4 overflow-x-auto">
        <div className="flex gap-2 w-max mx-auto">
          {imagenes.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  )
}
