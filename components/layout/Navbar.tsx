'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Menu, X, User, LogOut, LayoutDashboard, Home, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const logout = useLogout()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.rol === 'admin'
  const isAnfitrion = user?.rol === 'anfitrion' || user?.rol === 'admin'

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  return (
    <header suppressHydrationWarning className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-emerald-600">Glamp</span>
            <span className="text-stone-800">eros</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {isAnfitrion ? (
            <Link
              href="/anfitrion"
              className="text-sm text-stone-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Mi panel
            </Link>
          ) : isAuthenticated && (
            <Link
              href="/anfitrion/glampings/nuevo"
              className="text-sm text-emerald-700 font-medium hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Publica tu glamping
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-stone-600 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
            >
              Admin
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link
                href="/favoritos"
                className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-stone-50 rounded-full transition-colors"
                title="Favoritos"
              >
                <Heart size={20} />
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-stone-200 hover:shadow-md transition-shadow"
                >
                  {user?.foto ? (
                    <img src={user.foto} alt={user.nombre} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                      {user?.nombre?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <ChevronDown
                    size={14}
                    className={`text-stone-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-50">
                    {/* Header del menú */}
                    <div className="px-4 py-2.5 border-b border-stone-100 mb-1">
                      <p className="text-sm font-semibold text-stone-800 truncate">{user?.nombre}</p>
                      <p className="text-xs text-stone-400 capitalize">{user?.rol}</p>
                    </div>

                    <Link
                      href="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <User size={16} /> Mi perfil
                    </Link>
                    <Link
                      href="/mis-reservas"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <Home size={16} /> Mis reservas
                    </Link>
                    <Link
                      href="/favoritos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <Heart size={16} /> Favoritos
                    </Link>
                    {isAnfitrion && (
                      <>
                        <hr className="my-1 border-stone-100" />
                        <Link
                          href="/anfitrion"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                        >
                          <LayoutDashboard size={16} /> Panel anfitrión
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-stone-100" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-stone-700 px-4 py-2 rounded-xl hover:bg-stone-100 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-stone-600"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-stone-100">
                {user?.foto ? (
                  <img src={user.foto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {user?.nombre?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-stone-800 truncate">{user?.nombre}</p>
                  <p className="text-xs text-stone-400 capitalize">{user?.rol}</p>
                </div>
              </div>
              <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-stone-700 border-b border-stone-50">
                Mi perfil
              </Link>
              <Link href="/mis-reservas" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-stone-700 border-b border-stone-50">
                Mis reservas
              </Link>
              <Link href="/favoritos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-stone-700 border-b border-stone-50">
                Favoritos
              </Link>
              {isAnfitrion ? (
                <Link href="/anfitrion" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-stone-700 border-b border-stone-50">
                  Panel anfitrión
                </Link>
              ) : (
                <Link href="/anfitrion/glampings/nuevo" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-emerald-700 font-medium border-b border-stone-50">
                  Publica tu glamping
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-stone-700 border-b border-stone-50">
                  Administración
                </Link>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="py-3 text-red-600 text-left font-medium"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 text-center rounded-xl border border-stone-300 text-stone-700 font-medium"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 text-center rounded-xl bg-emerald-600 text-white font-medium"
              >
                Registrarse gratis
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
