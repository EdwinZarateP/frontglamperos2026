'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tent, CalendarDays, PlusCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/anfitrion', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/anfitrion/glampings', label: 'Mis glampings', icon: Tent },
  { href: '/anfitrion/glampings/nuevo', label: 'Publicar glamping', icon: PlusCircle },
  { href: '/anfitrion/calendario', label: 'Calendario', icon: CalendarDays },
]

export default function AnfitrionLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated) return null
  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-white border-r border-stone-200 shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-800">Panel anfitrión</p>
          <p className="text-xs text-stone-400 truncate">{user?.nombre}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors',
                pathname === href
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
              )}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-100">
          <Link href="/" className="text-xs text-stone-400 hover:text-stone-600">
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      <div className="flex-1 bg-stone-50">
        <div className="md:hidden flex gap-2 overflow-x-auto p-3 bg-white border-b border-stone-200 scrollbar-hide">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'shrink-0 px-3 py-2 rounded-lg text-xs font-medium border',
                pathname === href
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'text-stone-600 bg-white border-stone-200'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="p-3 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
