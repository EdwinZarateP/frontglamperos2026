'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

// Admin tiene su propio panel oscuro → ocultar Navbar y Footer
// Anfitrión mantiene el Navbar de Glamperos pero no el Footer
const NO_NAVBAR = ['/admin']
const NO_FOOTER = ['/admin', '/anfitrion']

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNavbar = NO_NAVBAR.some((p) => pathname.startsWith(p))
  const hideFooter = NO_FOOTER.some((p) => pathname.startsWith(p))

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className={hideNavbar && hideFooter ? '' : 'min-h-screen'}>{children}</main>
      {!hideFooter && <Footer />}
    </>
  )
}
