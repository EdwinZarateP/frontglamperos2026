'use client'

import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { WhatsAppFloatingButton } from '@/components/home/WhatsAppFloatingButton'

// Admin tiene su propio panel oscuro → ocultar Navbar y Footer
// Anfitrión mantiene el Navbar de Glamperos pero no el Footer
const NO_NAVBAR = ['/admin']
const NO_FOOTER = ['/admin', '/anfitrion']
const NO_WHATSAPP = ['/admin', '/anfitrion', '/auth', '/pago', '/calificaciones', '/blog', '/favoritos', '/mis-reservas', '/perfil']

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNavbar = NO_NAVBAR.some((p) => pathname.startsWith(p))
  const hideFooter = NO_FOOTER.some((p) => pathname.startsWith(p))
  const hideWhatsApp = NO_WHATSAPP.some((p) => pathname.startsWith(p))

  return (
    <>
      {!hideNavbar && (
        <Suspense fallback={<NavbarFallback />}>
          <Navbar />
        </Suspense>
      )}
      <main className={hideNavbar && hideFooter ? '' : 'min-h-screen'}>{children}</main>
      {!hideFooter && <Footer />}
      {/* WhatsApp button en home, páginas de búsqueda y detalle de glamping */}
      {!hideWhatsApp && <WhatsAppFloatingButton />}
    </>
  )
}

// Fallback del Navbar mientras se carga (evita layout shift)
function NavbarFallback() {
  return (
    <header className="sticky top-0 z-40 h-16 flex items-center px-4 sm:px-6 bg-stone-100 animate-pulse" style={{ backgroundColor: '#0D261B' }}>
      <div className="w-32 h-8 bg-white/10 rounded" />
      <div className="flex-1" />
      <div className="flex gap-2">
        <div className="w-20 h-8 bg-white/10 rounded" />
        <div className="w-20 h-8 bg-white/10 rounded" />
      </div>
    </header>
  )
}