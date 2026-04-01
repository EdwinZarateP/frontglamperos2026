'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Tent, Users } from 'lucide-react'
import { api } from '@/lib/api'

function StatCard({
  label, value, icon: Icon, color
}: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
      <div className={`p-2.5 sm:p-3 rounded-xl ${color} shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs sm:text-sm text-stone-400">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-stone-900">{value}</p>
      </div>
    </div>
  )
}

const SEASONS = [
  { key: 'navidad',      label: 'Navidad',      emoji: '🎄' },
  { key: 'halloween',    label: 'Halloween',    emoji: '🎃' },
  { key: 'san-valentin', label: 'San Valentín', emoji: '❤️' },
]

function SeasonWidget() {
  const qc = useQueryClient()

  const { data: active } = useQuery<string | null>({
    queryKey: ['active-season'],
    queryFn: async () => {
      const res = await api.get('/config/season')
      return res.data.activeSeason
    },
  })

  const { mutate: setSeason, isPending } = useMutation({
    mutationFn: (activeSeason: string | null) =>
      api.put('/config/season', { activeSeason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['active-season'] }),
  })

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-800">Decoración de temporada</h2>
        {active && (
          <button
            onClick={() => setSeason(null)}
            disabled={isPending}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
          >
            Apagar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {SEASONS.map(s => {
          const isActive = active === s.key
          return (
            <button
              key={s.key}
              onClick={() => setSeason(isActive ? null : s.key)}
              disabled={isPending}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 border-emerald-400 text-brand-light shadow-sm'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span className="text-lg">{s.emoji}</span>
              {s.label}
              {isActive && <span className="text-xs bg-emerald-100 text-brand px-1.5 py-0.5 rounded-md ml-1">Activa</span>}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-stone-400 mt-3">
        {active
          ? `La decoración de ${SEASONS.find(s => s.key === active)?.label} está activa en el header.`
          : 'Ninguna decoración activa. Selecciona una temporada para activarla.'}
      </p>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: glampings = [] } = useQuery<any[]>({
    queryKey: ['admin-glampings-count'],
    queryFn: async () => (await api.get('/glampings/todos/')).data,
  })

  const { data: usuarios = [] } = useQuery<any[]>({
    queryKey: ['admin-usuarios-count'],
    queryFn: async () => (await api.get('/usuarios/todos/lista')).data,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Glampings activos"    value={String(glampings.length)} icon={Tent}  color="bg-blue-500"   />
        <StatCard label="Usuarios registrados" value={String(usuarios.length)}  icon={Users} color="bg-purple-500" />
      </div>

      <SeasonWidget />

      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/reservas',    label: 'Reservas pendientes' },
            { href: '/admin/glampings',   label: 'Gestionar glampings' },
            { href: '/admin/usuarios',    label: 'Gestionar usuarios'  },
            { href: '/admin/comentarios', label: 'Comentarios'         },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="p-3 sm:p-4 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors text-center font-medium"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
