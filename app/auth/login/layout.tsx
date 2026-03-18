import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Glamperos',
  description: 'Accede a tu cuenta de Glamperos para gestionar tus reservas, favoritos y más.',
  alternates: { canonical: '/auth/login' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
