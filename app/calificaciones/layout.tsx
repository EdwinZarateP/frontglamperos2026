import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calificaciones | Glamperos',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
