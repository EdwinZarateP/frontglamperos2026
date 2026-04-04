'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Menu, X, User, LogOut, LayoutDashboard, Home, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { SeasonalOverlay } from '@/components/seasonal/SeasonalOverlay'

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
    <header suppressHydrationWarning className="sticky top-0 z-40" style={{ backgroundColor: '#0D261B' }}>
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 relative z-10">
          <div className="h-16 flex items-center justify-center overflow-hidden">
            <img 
              src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/logo_glamepros_2026.png" 
              alt="Glamperos" 
              className="w-auto h-full object-contain scale-125"
            />
          </div>
        </Link>

        {/* Zona vacía — el personaje vive exactamente aquí, entre logo y botones */}
        <div className="flex-1 h-full relative pointer-events-none z-0">
          <SeasonalOverlay />
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2 shrink-0 relative z-10">
          {isAnfitrion ? (
            <Link
              href="/anfitrion"
              className="text-sm text-white hover:text-stone-200 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Mi panel
            </Link>
          ) : isAuthenticated && (
            <Link
              href="/anfitrion/glampings/nuevo"
              className="text-sm text-white font-medium hover:text-stone-200 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Publica tu glamping
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm text-white hover:text-stone-200 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Admin
            </Link>
          )}

          <Link
            href="/blog"
            className="text-sm text-stone-200 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            Blog
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/favoritos"
                className="p-2 text-white hover:text-stone-200 hover:bg-white/10 rounded-full transition-colors"
                title="Favoritos"
              >
                <Heart size={20} />
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-white/30 hover:border-white/50 hover:shadow-md transition-shadow"
                >
                  <div className="w-7 h-7 rounded-full relative overflow-hidden bg-white/90 flex items-center justify-center text-stone-800 text-sm font-bold">
                    {user?.nombre?.[0]?.toUpperCase()}
                    {user?.foto && (
                      <img
                        src={user.foto}
                        alt={user.nombre}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-stone-300 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
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
                className="text-sm font-medium text-white px-4 py-2 rounded-xl border border-white/30 hover:bg-white/10 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                className="text-sm font-medium text-white px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-white shrink-0 relative z-10 hover:bg-white/10 rounded-full transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 py-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: '#0D261B' }}>
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-white/20">
                <div className="w-10 h-10 rounded-full relative overflow-hidden bg-white/90 flex items-center justify-center text-stone-800 text-lg font-bold shrink-0">
                  {user?.nombre?.[0]?.toUpperCase()}
                  {user?.foto && (
                    <img
                      src={user.foto}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{user?.nombre}</p>
                  <p className="text-xs text-white/70 capitalize">{user?.rol}</p>
                </div>
              </div>
              <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-white border-b border-white/10">
                Mi perfil
              </Link>
              <Link href="/mis-reservas" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-white border-b border-white/10">
                Mis reservas
              </Link>
              <Link href="/favoritos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-white border-b border-white/10">
                Favoritos
              </Link>
              {isAnfitrion ? (
                <Link href="/anfitrion" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-white border-b border-white/10">
                  Panel anfitrión
                </Link>
              ) : (
                <Link href="/anfitrion/glampings/nuevo" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-stone-200 font-medium border-b border-white/10">
                  Publica tu glamping
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-white border-b border-white/10">
                  Administración
                </Link>
              )}
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 py-3 text-white border-b border-white/10">
                Blog
              </Link>
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="py-3 text-red-300 text-left font-medium"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="py-3 text-white border-b border-white/10">
                Blog
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 text-center rounded-xl border border-white/30 text-white font-medium hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/registro"
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 text-center rounded-xl border border-white/30 text-stone-200 font-medium hover:bg-white/10"
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
