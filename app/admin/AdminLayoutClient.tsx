'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tent, Users, MessageSquare, CalendarDays, ShieldCheck, Bot } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/aprobaciones', label: 'Aprobaciones', icon: ShieldCheck },
  { href: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/admin/glampings', label: 'Glampings', icon: Tent },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/comentarios', label: 'Comentarios', icon: MessageSquare },
  { href: '/admin/bot',         label: 'Bot WhatsApp', icon: Bot },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated || user?.rol !== 'admin') {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.rol !== 'admin') return null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-stone-900 text-white shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-stone-800">
          <p className="text-sm font-semibold text-emerald-400">Panel Admin</p>
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
                  ? 'bg-brand text-white'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white'
              )}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-800">
          <Link href="/" className="text-xs text-stone-500 hover:text-stone-300">
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 bg-stone-50 min-w-0">
        {/* Mobile nav */}
        <div className="md:hidden bg-stone-900 border-b border-stone-800">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-xs font-semibold text-emerald-400">Panel Admin</p>
            <Link href="/" className="text-[10px] text-stone-500 hover:text-stone-300">← Sitio</Link>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide px-2 pb-2 gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-medium min-w-[56px]',
                  pathname === href
                    ? 'bg-brand text-white'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="p-3 sm:p-6">{children}</div>
      </div>
    </div>
  )
}
