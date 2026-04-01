'use client'

import Link from 'next/link'
import { useQuery, useQueries } from '@tanstack/react-query'
import { CalendarDays, Tent, DollarSign, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP } from '@/lib/utils'

interface Reserva {
  id: string
  glampingId: string
  estado: string
  fechaInicio?: string
  fecha?: string
  precioTotal: number
  createdAt: string
}

export default function AnfitrionDashboard() {
  const { user } = useAuthStore()

  const { data: misGlampings } = useQuery({
    queryKey: ['mis-glampings'],
    queryFn: async () => (await api.get('/usuarios/me/glampings')).data,
    enabled: !!user,
  })

  const glampings: { _id: string; nombreGlamping: string; calificacion: number; imagenes: string[]; estadoAprobacion: string }[] =
    misGlampings?.data || misGlampings || []

  const reservasQ = useQueries({
    queries: glampings.map((g) => ({
      queryKey: ['dash-reservas', g._id],
      queryFn: async (): Promise<Reserva[]> => (await api.get(`/reservas/glamping/${g._id}`)).data,
    })),
  })

  const todasReservas: Reserva[] = reservasQ.flatMap((q) => q.data ?? [])

  const now = new Date()
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const ingresosMes = todasReservas
    .filter((r) =>
      (r.estado === 'CONFIRMADA' || r.estado === 'COMPLETADA') &&
      (r.fechaInicio ?? r.fecha ?? r.createdAt ?? '').startsWith(mesActual)
    )
    .reduce((sum, r) => sum + (r.precioTotal || 0), 0)

  const calificaciones = glampings.map((g) => g.calificacion).filter((c) => c > 0)
  const calProm = calificaciones.length
    ? (calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Hola, {user?.nombre?.split(' ')[0]} 👋</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Mis glampings', value: String(glampings.length),       icon: Tent,      color: 'bg-brand' },
          { label: 'Ingresos mes',  value: ingresosMes > 0 ? formatCOP(ingresosMes) : '$0', icon: DollarSign, color: 'bg-amber-500' },
          { label: 'Calificación',  value: calProm,                        icon: Star,      color: 'bg-purple-500'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-stone-400">{label}</p>
              <p className="text-xl font-bold text-stone-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mis glampings */}
      {glampings.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-stone-800">Mis glampings</h2>
            <Link href="/anfitrion/glampings" className="text-sm text-brand hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {glampings.slice(0, 4).map((g) => (
              <Link
                key={g._id}
                href={`/glamping/${g._id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors"
              >
                {g.imagenes?.[0] && (
                  <img src={g.imagenes[0]} alt="" className="w-14 h-14 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm truncate">{g.nombreGlamping}</p>
                  {g.estadoAprobacion === 'pendiente' && (
                    <span className="inline-block text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En revisión</span>
                  )}
                  {g.estadoAprobacion === 'rechazado' && (
                    <span className="inline-block text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Rechazado</span>
                  )}
                  {g.estadoAprobacion === 'aprobado' && (
                    <span className="inline-block text-[10px] bg-emerald-100 text-brand-light px-2 py-0.5 rounded-full">Publicado</span>
                  )}
                  {g.calificacion > 0 && (
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {g.calificacion.toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Atajo calendario */}
      <Link href="/anfitrion/calendario" className="flex items-center gap-4 bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow">
        <CalendarDays size={28} className="text-brand shrink-0" />
        <div>
          <p className="font-medium text-stone-800">Ver calendario</p>
          <p className="text-xs text-stone-400 mt-0.5">Gestiona tus bloqueos y disponibilidad</p>
        </div>
      </Link>
    </div>
  )
}
