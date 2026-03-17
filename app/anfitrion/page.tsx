'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Tent, DollarSign, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatCOP } from '@/lib/utils'

export default function AnfitrionDashboard() {
  const { user } = useAuthStore()

  const { data: misGlampings } = useQuery({
    queryKey: ['mis-glampings'],
    queryFn: async () => {
      const res = await api.get('/usuarios/me/glampings')
      return res.data
    },
    enabled: !!user,
  })

  const { data: misReservas } = useQuery({
    queryKey: ['anfitrion-reservas'],
    queryFn: async () => {
      const res = await api.get('/reservas/', { params: { limit: 5 } })
      return res.data
    },
  })

  const glampings: { _id: string; nombreGlamping: string; calificacion: number; imagenes: string[] }[] = misGlampings?.data || misGlampings || []

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Hola, {user?.nombre?.split(' ')[0]} 👋</h1>
        <Link
          href="/anfitrion/glampings/nuevo"
          className="shrink-0 px-3 py-2 bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
        >
          + Publicar
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Mis glampings', value: String(glampings.length), icon: Tent, color: 'bg-emerald-500' },
          { label: 'Reservas activas', value: String(misReservas?.total || 0), icon: CalendarDays, color: 'bg-blue-500' },
          { label: 'Ingresos mes', value: '—', icon: DollarSign, color: 'bg-amber-500' },
          { label: 'Calificación', value: '—', icon: Star, color: 'bg-purple-500' },
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
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-stone-800">Mis glampings</h2>
            <Link href="/anfitrion/glampings" className="text-sm text-emerald-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {glampings.slice(0, 4).map((g) => (
              <Link
                key={g._id}
                href={`/glamping/${g._id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors"
              >
                {g.imagenes?.[0] && (
                  <img
                    src={g.imagenes[0]}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm truncate">{g.nombreGlamping}</p>
                  {(g as any).estadoAprobacion === 'pendiente' && (
                    <span className="inline-block text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En revisión</span>
                  )}
                  {(g as any).estadoAprobacion === 'rechazado' && (
                    <span className="inline-block text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Rechazado</span>
                  )}
                  {(g as any).estadoAprobacion === 'aprobado' && (
                    <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Publicado</span>
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

      {/* Atajos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/anfitrion/calendario" className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow text-center">
          <CalendarDays size={28} className="text-emerald-600 mx-auto mb-2" />
          <p className="font-medium text-stone-800">Ver calendario</p>
          <p className="text-xs text-stone-400 mt-1">Gestiona tus reservas y bloqueos</p>
        </Link>
        <Link href="/anfitrion/glampings/nuevo" className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow text-center">
          <Tent size={28} className="text-emerald-600 mx-auto mb-2" />
          <p className="font-medium text-stone-800">Nuevo glamping</p>
          <p className="text-xs text-stone-400 mt-1">Publica tu propiedad gratis</p>
        </Link>
        <a href="/anfitrion/glampings" className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow text-center">
          <Star size={28} className="text-emerald-600 mx-auto mb-2" />
          <p className="font-medium text-stone-800">Estadísticas</p>
          <p className="text-xs text-stone-400 mt-1">Ingresos y ocupación</p>
        </a>
      </div>
    </div>
  )
}
