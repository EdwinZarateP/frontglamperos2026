'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, MailOpen, Mail } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface Comentario {
  id: string
  nombre: string
  email?: string
  tipo: string
  mensaje: string
  estado: 'pendiente' | 'leido'
  createdAt: string
}

const TIPO_COLOR: Record<string, string> = {
  sugerencia:   'bg-blue-100 text-blue-700',
  queja:        'bg-red-100 text-red-600',
  felicitacion: 'bg-emerald-100 text-emerald-700',
  otro:         'bg-stone-100 text-stone-600',
}
const TIPO_LABEL: Record<string, string> = {
  sugerencia:   'Sugerencia',
  queja:        'Queja',
  felicitacion: 'Felicitación',
  otro:         'Otro',
}

function fmtFecha(iso: string) {
  const d = new Date(iso)
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

export default function AdminComentariosPage() {
  const qc = useQueryClient()
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-comentarios', filtroTipo, filtroEstado],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' }
      if (filtroTipo) params.tipo = filtroTipo
      if (filtroEstado) params.estado = filtroEstado
      return (await api.get('/comentarios/', { params })).data
    },
  })

  const comentarios: Comentario[] = data?.data ?? []
  const pendientes = data?.total ?? 0

  const marcarEstado = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      api.put(`/comentarios/${id}/estado`, null, { params: { estado } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-comentarios'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const eliminar = useMutation({
    mutationFn: (id: string) => api.delete(`/comentarios/${id}`),
    onSuccess: () => {
      toast.success('Comentario eliminado')
      qc.invalidateQueries({ queryKey: ['admin-comentarios'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-stone-900">Comentarios de la plataforma</h1>
        {pendientes > 0 && (
          <span className="text-sm text-stone-400">{pendientes} total</span>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {/* Tipo */}
        {['', 'sugerencia', 'queja', 'felicitacion', 'otro'].map((t) => (
          <button key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${filtroTipo === t
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {t === '' ? 'Todos' : TIPO_LABEL[t]}
          </button>
        ))}
        <div className="w-px bg-stone-200 mx-1" />
        {/* Estado */}
        {['', 'pendiente', 'leido'].map((e) => (
          <button key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${filtroEstado === e
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {e === '' ? 'Cualquier estado' : e === 'pendiente' ? 'Pendientes' : 'Leídos'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : comentarios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400">No hay comentarios.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comentarios.map((c) => (
            <li key={c.id}
              className={`bg-white rounded-2xl border p-5 space-y-3 transition-opacity
                ${c.estado === 'leido' ? 'opacity-60 border-stone-100' : 'border-stone-200'}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${TIPO_COLOR[c.tipo] ?? 'bg-stone-100 text-stone-600'}`}>
                    {TIPO_LABEL[c.tipo] ?? c.tipo}
                  </span>
                  <span className="text-sm font-medium text-stone-800">{c.nombre}</span>
                  {c.email && <span className="text-xs text-stone-400">{c.email}</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-stone-400">{fmtFecha(c.createdAt)}</span>
                  <button
                    onClick={() => marcarEstado.mutate({ id: c.id, estado: c.estado === 'leido' ? 'pendiente' : 'leido' })}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title={c.estado === 'leido' ? 'Marcar como pendiente' : 'Marcar como leído'}>
                    {c.estado === 'leido' ? <Mail size={15} /> : <MailOpen size={15} />}
                  </button>
                  <button
                    onClick={() => { if (confirm('¿Eliminar comentario?')) eliminar.mutate(c.id) }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Mensaje */}
              <p className="text-sm text-stone-700 leading-relaxed">{c.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
