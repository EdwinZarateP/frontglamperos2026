'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Star, MapPin, ImageIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Glamping {
  _id: string
  nombreGlamping: string
  nombrePropiedad?: string
  tipoGlamping: string
  ciudadDepartamento: string
  precioNoche: number
  imagenes: string[]
  calificacion: number
  habilitado: boolean
  borrador: boolean
  estadoAprobacion?: string
  motivoRechazo?: string
}

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  pendiente: { label: 'En revisión',  className: 'bg-amber-100 text-amber-700' },
  aprobado:  { label: 'Publicado',    className: 'bg-emerald-100 text-brand-light' },
  rechazado: { label: 'Rechazado',    className: 'bg-red-100 text-red-600' },
}

export default function MisGlampingsPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery<Glamping[]>({
    queryKey: ['mis-glampings-full'],
    queryFn: async () => {
      const res = await api.get('/usuarios/me/glampings')
      const all: Glamping[] = res.data?.data ?? res.data ?? []
      // Excluir borradores que aún no se han enviado a revisión
      return all.filter((g) => !g.borrador)
    },
    enabled: !!user,
  })

  const glampings = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Mis glampings</h1>
          <p className="text-stone-400 text-sm mt-0.5">{glampings.length} propiedad{glampings.length !== 1 ? 'es' : ''}</p>
        </div>
        <Link
          href="/anfitrion/glampings/nuevo"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-light transition-colors"
        >
          <Plus size={16} /> Nuevo glamping
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && glampings.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 mb-4">Aún no has publicado ningún glamping</p>
          <Link
            href="/anfitrion/glampings/nuevo"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-light"
          >
            <Plus size={16} /> Publicar mi primer glamping
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {glampings.map((g) => {
          const estado = g.borrador ? null : (g.estadoAprobacion ? ESTADO_BADGE[g.estadoAprobacion] : null)
          return (
            <div key={g._id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagen */}
              <div className="relative h-44 bg-stone-100">
                {g.imagenes?.[0] ? (
                  <img src={g.imagenes[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-stone-300" />
                  </div>
                )}
                {/* Badge estado */}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  {g.borrador && (
                    <span className="text-xs bg-stone-700/80 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">Borrador</span>
                  )}
                  {!g.borrador && estado && (
                    <span className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-sm ${estado.className}`}>
                      {estado.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{g.nombreGlamping}</p>
                    {g.nombrePropiedad && <p className="text-xs text-stone-400 truncate">{g.nombrePropiedad}</p>}
                  </div>
                  {g.calificacion > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-stone-500 shrink-0">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      {g.calificacion.toFixed(1)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                  <span className="flex items-center gap-0.5"><MapPin size={11} />{g.ciudadDepartamento}</span>
                  <span className="capitalize">{g.tipoGlamping}</span>
                </div>

                <p className="text-sm font-medium text-stone-700 mt-2">{formatCOP(g.precioNoche)}<span className="font-normal text-stone-400"> / noche</span></p>

                {/* Motivo rechazo */}
                {g.estadoAprobacion === 'rechazado' && g.motivoRechazo && (
                  <p className="mt-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    Motivo: {g.motivoRechazo}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/anfitrion/glampings/${g._id}`}
                    className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Editar
                  </Link>
                  {!g.borrador && (
                    <Link
                      href={`/glamping/${g._id}`}
                      target="_blank"
                      className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-xl border border-emerald-200 text-brand hover:bg-emerald-50 transition-colors"
                    >
                      Ver página
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
