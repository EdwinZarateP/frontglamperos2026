'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Eye, MapPin, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { api, getErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { formatCOP } from '@/lib/utils'

interface GlampingPendiente {
  _id: string
  nombreGlamping: string
  nombrePropiedad?: string
  tipoGlamping: string
  ciudadDepartamento: string
  precioNoche: number
  imagenes: string[]
  descripcionGlamping: string
  propietarioId: string
  estadoAprobacion: string
  updatedAt?: string
}

export default function AdminAprobacionesPage() {
  const queryClient = useQueryClient()
  const [motivoRechazo, setMotivoRechazo] = useState<Record<string, string>>({})
  const [rechazando, setRechazando] = useState<string | null>(null)

  const { data: pendientes = [], isLoading } = useQuery<GlampingPendiente[]>({
    queryKey: ['admin-pendientes'],
    queryFn: async () => {
      const { data } = await api.get('/glampings/admin/pendientes-aprobacion')
      return data
    },
  })

  const aprobar = useMutation({
    mutationFn: (id: string) => api.post(`/glampings/${id}/aprobar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pendientes'] })
      toast.success('Glamping aprobado y publicado')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const rechazar = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      api.post(`/glampings/${id}/rechazar?motivo=${encodeURIComponent(motivo)}`),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pendientes'] })
      setRechazando(null)
      setMotivoRechazo((prev) => { const n = { ...prev }; delete n[id]; return n })
      toast.success('Glamping rechazado — el anfitrión será notificado')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Aprobaciones de glampings</h1>
        <p className="text-stone-400 text-sm mt-1">
          {isLoading ? 'Cargando...' : `${pendientes.length} glamping${pendientes.length !== 1 ? 's' : ''} pendiente${pendientes.length !== 1 ? 's' : ''} de revisión`}
        </p>
      </div>

      {!isLoading && pendientes.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-stone-500">No hay glampings pendientes de aprobación</p>
        </div>
      )}

      <div className="space-y-4">
        {pendientes.map((g) => (
          <div key={g._id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="flex gap-4 p-4">
              {/* Foto */}
              <div className="w-32 h-24 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                {g.imagenes?.[0] ? (
                  <img src={g.imagenes[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-stone-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-900">{g.nombreGlamping}</p>
                    {g.nombrePropiedad && <p className="text-xs text-stone-400">{g.nombrePropiedad}</p>}
                  </div>
                  <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En revisión</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-stone-500">
                  <span className="capitalize">{g.tipoGlamping}</span>
                  <span className="flex items-center gap-0.5"><MapPin size={11} />{g.ciudadDepartamento}</span>
                  <span className="font-medium text-stone-700">{formatCOP(g.precioNoche)} / noche</span>
                  <span>{g.imagenes?.length || 0} fotos</span>
                </div>
                <p className="text-xs text-stone-400 mt-2 line-clamp-2">{g.descripcionGlamping}</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="border-t border-stone-100 px-4 py-3 flex flex-wrap items-center gap-3 bg-stone-50">
              <Link
                href={`/glamping/${g._id}`}
                target="_blank"
                className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700"
              >
                <Eye size={14} /> Ver glamping
              </Link>

              <div className="flex-1" />

              {rechazando === g._id ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Motivo del rechazo (opcional)"
                    value={motivoRechazo[g._id] || ''}
                    onChange={(e) => setMotivoRechazo((prev) => ({ ...prev, [g._id]: e.target.value }))}
                    className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRechazando(null)}
                  >
                    Cancelar
                  </Button>
                  <button
                    onClick={() => rechazar.mutate({ id: g._id, motivo: motivoRechazo[g._id] || '' })}
                    disabled={rechazar.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Confirmar rechazo
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setRechazando(g._id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50"
                  >
                    <XCircle size={14} /> Rechazar
                  </button>
                  <button
                    onClick={() => aprobar.mutate(g._id)}
                    disabled={aprobar.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-light disabled:opacity-50"
                  >
                    <CheckCircle size={14} /> Aprobar y publicar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
