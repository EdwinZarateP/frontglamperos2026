'use client'

import { useState } from 'react'
import { useQuery, useQueries, useMutation } from '@tanstack/react-query'
import { Star, Copy, X } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface LinkCalificacion {
  link: string
  mensajeWhatsApp: string
}

interface Reserva {
  id: string
  glampingId: string
  usuarioId: string
  tipo: 'NOCHES' | 'PASADIA'
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA'
  fechaInicio?: string
  fechaFin?: string
  fecha?: string
  huespedes: number
  huespedesAdicionales?: number
  precioBase: number
  precioExtras: number
  precioTotal: number
  notasEspeciales?: string
  createdAt: string
  metadata?: Record<string, string>
}

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:  'bg-amber-100 text-amber-700',
  CONFIRMADA: 'bg-emerald-100 text-brand-light',
  COMPLETADA: 'bg-blue-100 text-blue-700',
  CANCELADA:  'bg-stone-100 text-stone-400',
}
const ESTADOS: Array<'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA'> = [
  'PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA',
]

function fmtFecha(iso?: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('T')[0].split('-')
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`
}

export default function AnfitrionReservasPage() {
  const { user } = useAuthStore()
  const [filtroEstado, setFiltroEstado] = useState<string>('todas')
  const [expandida, setExpandida] = useState<string | null>(null)

  const { data: misGlampings } = useQuery({
    queryKey: ['mis-glampings'],
    queryFn: async () => (await api.get('/usuarios/me/glampings')).data,
    enabled: !!user,
  })
  const glampings: { _id: string; nombreGlamping: string }[] =
    misGlampings?.data || misGlampings || []

  const reservasQ = useQueries({
    queries: glampings.map((g) => ({
      queryKey: ['anf-reservas', g._id],
      queryFn: async (): Promise<Reserva[]> => (await api.get(`/reservas/glamping/${g._id}`)).data,
    })),
  })

  const loading = reservasQ.some((q) => q.isLoading)
  const refetchAll = () => reservasQ.forEach((q) => q.refetch())

  const todasReservas: Reserva[] = reservasQ.flatMap((q) => q.data ?? [])
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))

  const reservas = filtroEstado === 'todas'
    ? todasReservas
    : todasReservas.filter((r) => r.estado === filtroEstado)

  const glampingNombre = (id: string) =>
    glampings.find((g) => g._id === id)?.nombreGlamping ?? '—'

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) =>
      api.put(`/reservas/${id}/estado`, { estado }),
    onSuccess: () => { toast.success('Estado actualizado'); refetchAll() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const [modalLink, setModalLink] = useState<LinkCalificacion | null>(null)
  const [generandoLink, setGenerandoLink] = useState<string | null>(null)

  async function generarLinkCalificacion(reservaId: string) {
    setGenerandoLink(reservaId)
    try {
      const res = await api.post(`/calificaciones/link/${reservaId}`)
      setModalLink({ link: res.data.link, mensajeWhatsApp: res.data.mensajeWhatsApp })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setGenerandoLink(null)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold text-stone-900">Mis reservas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['todas', ...ESTADOS].map((e) => (
          <button key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${filtroEstado === e
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {e === 'todas' ? 'Todas' : e.charAt(0) + e.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : reservas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400">No hay reservas{filtroEstado !== 'todas' ? ` con estado ${filtroEstado.toLowerCase()}` : ''}.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reservas.map((r) => {
            const abierta = expandida === r.id
            const fechas = r.tipo === 'PASADIA'
              ? `☀️ Pasadía · ${fmtFecha(r.fecha)}`
              : `🌙 Noches · ${fmtFecha(r.fechaInicio)} → ${fmtFecha(r.fechaFin)}`

            return (
              <li key={r.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandida(abierta ? null : r.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-stone-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-800 truncate">{glampingNombre(r.glampingId)}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{fechas}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-stone-900">{formatCOP(r.precioTotal)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLOR[r.estado] ?? ''}`}>
                      {r.estado}
                    </span>
                  </div>
                </button>

                {/* Detalle expandido */}
                {abierta && (
                  <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-stone-400">Huéspedes</p>
                        <p className="font-medium text-stone-800">{r.huespedes}{r.huespedesAdicionales ? ` + ${r.huespedesAdicionales} adic.` : ''}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">Recibida el</p>
                        <p className="font-medium text-stone-800">{fmtFecha(r.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400">Precio base</p>
                        <p className="font-medium text-stone-800">{formatCOP(r.precioBase)}</p>
                      </div>
                      {r.precioExtras > 0 && (
                        <div>
                          <p className="text-xs text-stone-400">Extras</p>
                          <p className="font-medium text-stone-800">{formatCOP(r.precioExtras)}</p>
                        </div>
                      )}
                    </div>
                    {r.notasEspeciales && (
                      <div className="bg-stone-50 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-stone-400 mb-0.5">Notas del huésped</p>
                        <p className="text-sm text-stone-700">{r.notasEspeciales}</p>
                      </div>
                    )}
                    {/* Link de calificación para reservas completadas */}
                    {r.estado === 'COMPLETADA' && (
                      <button
                        onClick={() => generarLinkCalificacion(r.id)}
                        disabled={generandoLink === r.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        <Star size={13} />
                        {generandoLink === r.id ? 'Generando...' : 'Generar link de calificación'}
                      </button>
                    )}

                    {/* Cambiar estado */}
                    {r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA' && (
                      <div>
                        <p className="text-xs text-stone-400 mb-2">Cambiar estado</p>
                        <div className="flex flex-wrap gap-2">
                          {ESTADOS.filter((e) => e !== r.estado).map((e) => (
                            <button key={e}
                              onClick={() => cambiarEstado.mutate({ id: r.id, estado: e })}
                              disabled={cambiarEstado.isPending}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                ${ESTADO_COLOR[e] ?? 'bg-stone-100 text-stone-600'} hover:opacity-80`}>
                              → {e.charAt(0) + e.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Modal link calificación */}
      {modalLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Star size={18} className="text-amber-400" /> Link de calificación
              </h2>
              <button onClick={() => setModalLink(null)} className="text-stone-400 hover:text-stone-700">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-stone-500">Comparte este mensaje con tu huésped por WhatsApp para que califique su estadía.</p>
            <div>
              <p className="text-xs text-stone-400 mb-1">Mensaje para WhatsApp</p>
              <div className="bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-200 text-sm text-stone-700 leading-relaxed">
                {modalLink.mensajeWhatsApp}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(modalLink.mensajeWhatsApp); toast.success('Mensaje copiado') }}
                className="mt-2 flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <Copy size={13} /> Copiar mensaje
              </button>
            </div>
            <div>
              <p className="text-xs text-stone-400 mb-1">O copia el link directamente</p>
              <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2 border border-stone-200">
                <span className="text-xs text-stone-700 truncate flex-1">{modalLink.link}</span>
                <button onClick={() => { navigator.clipboard.writeText(modalLink.link); toast.success('Link copiado') }}
                  className="shrink-0 text-brand hover:text-brand-dark">
                  <Copy size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
