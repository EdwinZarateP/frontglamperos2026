'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Tent, Users } from 'lucide-react'
import { api } from '@/lib/api'


function StatCard({
  label, value, icon: Icon, color
}: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-stone-400">{label}</p>
        <p className="text-2xl font-bold text-stone-900">{value}</p>
      </div>
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
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Glampings activos"
          value={String(glampings.length)}
          icon={Tent}
          color="bg-blue-500"
        />
        <StatCard
          label="Usuarios registrados"
          value={String(usuarios.length)}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Accesos rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/reservas', label: 'Ver reservas pendientes' },
            { href: '/admin/glampings', label: 'Gestionar glampings' },
            { href: '/admin/usuarios', label: 'Gestionar usuarios' },
            { href: '/admin/comentarios', label: 'Comentarios plataforma' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="p-4 rounded-xl border border-stone-200 text-sm text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors text-center"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
