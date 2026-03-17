'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Search, Pencil, Eye, MapPin, Download, Users, X, Trash2, UserPlus, Plus } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { formatCOP, tipoGlampingLabels } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface GlampingAdmin {
  _id: string
  nombreGlamping: string
  nombrePropiedad?: string
  tipoGlamping: string
  ciudadDepartamento: string
  precioNoche: number
  precioPasadia?: number
  calificacion: number
  habilitado: boolean
  estadoAprobacion?: string
  imagenes: string[]
  propietarioId?: string
  propietario?: { nombre?: string; email?: string; telefono?: string }
}

interface Anfitrion {
  id: string
  nombre?: string
  email?: string
  esPropietarioPrincipal: boolean
}

interface Usuario {
  id?: string
  _id?: string
  nombre: string
  email: string
  rol: string
}

const ESTADO_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente:  { label: 'Pendiente',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  aprobado:   { label: 'Aprobado',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rechazado:  { label: 'Rechazado',  className: 'bg-red-50 text-red-600 border-red-200' },
  inactivo:   { label: 'Inactivo',   className: 'bg-stone-100 text-stone-500 border-stone-200' },
}

function ModalAnfitriones({
  glamping,
  onClose,
}: {
  glamping: GlampingAdmin
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [buscarEmail, setBuscarEmail] = useState('')

  const { data: anfitriones = [], isLoading, refetch } = useQuery<Anfitrion[]>({
    queryKey: ['glamping-anfitriones', glamping._id],
    queryFn: async () => (await api.get(`/glampings/${glamping._id}/anfitriones`)).data,
  })

  const { data: todosUsuarios = [] } = useQuery<Usuario[]>({
    queryKey: ['admin-usuarios'],
    queryFn: async () => (await api.get('/usuarios/todos/lista')).data,
  })

  const agregar = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/glampings/${glamping._id}/anfitriones`, { userId })
    },
    onSuccess: () => {
      refetch()
      setBuscarEmail('')
      toast.success('Anfitrión añadido')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const quitar = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/glampings/${glamping._id}/anfitriones/${userId}`)
    },
    onSuccess: () => {
      refetch()
      toast.success('Anfitrión eliminado')
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const anfitrionIds = new Set(anfitriones.map((a) => a.id))
  const sugeridos = buscarEmail.trim()
    ? todosUsuarios.filter(
        (u) =>
          !anfitrionIds.has(u.id ?? u._id ?? '') &&
          (u.email.toLowerCase().includes(buscarEmail.toLowerCase()) ||
            u.nombre.toLowerCase().includes(buscarEmail.toLowerCase()))
      ).slice(0, 5)
    : []

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900">Anfitriones</h3>
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{glamping.nombreGlamping}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-stone-100"><X size={18} /></button>
        </div>

        {/* Lista actual */}
        {isLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <ul className="space-y-2">
            {anfitriones.map((a) => (
              <li key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                  {a.nombre?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{a.nombre ?? '—'}</p>
                  <p className="text-xs text-stone-400 truncate">{a.email}</p>
                </div>
                {a.esPropietarioPrincipal ? (
                  <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Principal</span>
                ) : (
                  <button
                    onClick={() => quitar.mutate(a.id)}
                    disabled={quitar.isPending}
                    className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Quitar anfitrión"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Añadir nuevo */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Añadir co-anfitrión</p>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={buscarEmail}
            onChange={(e) => setBuscarEmail(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {sugeridos.length > 0 && (
            <ul className="space-y-1">
              {sugeridos.map((u) => {
                const uid = u.id ?? u._id ?? ''
                return (
                  <li key={uid} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{u.nombre}</p>
                      <p className="text-xs text-stone-400 truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => agregar.mutate(uid)}
                      disabled={agregar.isPending}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <UserPlus size={12} /> Añadir
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminGlampingsPage() {
  const [busqueda, setBusqueda] = useState('')
  const [modalAnfitriones, setModalAnfitriones] = useState<GlampingAdmin | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-glampings-lista'],
    queryFn: async () => {
      const res = await api.get('/glampings/todos/')
      return res.data as GlampingAdmin[]
    },
  })

  const glampings = data ?? []

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      await api.put(`/glampings/${id}/estado`, null, { params: { estado } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glampings-lista'] })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  const filtrados = busqueda.trim()
    ? glampings.filter((g) =>
        g.nombreGlamping.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.nombrePropiedad?.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.ciudadDepartamento.toLowerCase().includes(busqueda.toLowerCase())
      )
    : glampings

  const [descargando, setDescargando] = useState(false)

  const descargarExcel = async () => {
    setDescargando(true)
    try {
      const res = await api.get('/glampings/todos/admin-detalle')
      const datos: GlampingAdmin[] = res.data

      const headers = ['Establecimiento', 'Glamping', 'ID', 'Ciudad', 'Precio noche', 'Precio pasadía', 'Anfitrión', 'Email anfitrión', 'Teléfono anfitrión']
      const rows = datos.map((g) => [
        g.nombrePropiedad ?? '',
        g.nombreGlamping,
        g._id,
        g.ciudadDepartamento,
        g.precioNoche,
        g.precioPasadia ?? '',
        g.propietario?.nombre ?? '',
        g.propietario?.email ?? '',
        g.propietario?.telefono ?? '',
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `glampings_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-stone-900">Glampings ({glampings.length})</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/anfitrion/glampings/nuevo"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={15} /> Crear glamping
          </Link>
          <div className="relative max-w-xs w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, establecimiento o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={descargarExcel}
            disabled={descargando}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-300 text-sm text-stone-600 hover:bg-stone-50 transition-colors shrink-0 disabled:opacity-50"
          >
            <Download size={15} /> {descargando ? 'Generando...' : 'Excel'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <p className="text-stone-400 text-sm py-8 text-center">No se encontraron glampings.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Glamping</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium hidden lg:table-cell">Establecimiento</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium hidden sm:table-cell">Ubicación</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium hidden md:table-cell">Precio/noche</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtrados.map((g) => (
                <tr key={g._id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {g.imagenes?.[0] ? (
                        <img src={g.imagenes[0]} alt={g.nombreGlamping} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-200 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-stone-900 line-clamp-1">{g.nombreGlamping}</p>
                        <p className="text-xs text-stone-400">{tipoGlampingLabels[g.tipoGlamping] ?? g.tipoGlamping}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-sm text-stone-700 line-clamp-1">{g.nombrePropiedad ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-1 text-stone-500">
                      <MapPin size={12} />
                      <span className="text-xs truncate max-w-[160px]">{g.ciudadDepartamento}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-stone-700 font-medium">
                    {formatCOP(g.precioNoche)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={g.estadoAprobacion ?? 'pendiente'}
                      onChange={(e) => cambiarEstado.mutate({ id: g._id, estado: e.target.value })}
                      className={`text-xs px-2 py-0.5 rounded-lg border font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        ESTADO_CONFIG[g.estadoAprobacion ?? 'pendiente']?.className ?? ESTADO_CONFIG.pendiente.className
                      }`}
                    >
                      {Object.entries(ESTADO_CONFIG).map(([val, { label }]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setModalAnfitriones(g)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-emerald-600 transition-colors"
                        title="Gestionar anfitriones"
                      >
                        <Users size={15} />
                      </button>
                      <Link href={`/glamping/${g._id}`} target="_blank"
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Ver">
                        <Eye size={15} />
                      </Link>
                      <Link href={`/anfitrion/glampings/${g._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors">
                        <Pencil size={13} /> Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAnfitriones && (
        <ModalAnfitriones
          glamping={modalAnfitriones}
          onClose={() => setModalAnfitriones(null)}
        />
      )}
    </div>
  )
}
