import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear Cuenta | Glamperos',
  description: 'Regístrate gratis en Glamperos y comienza a reservar los mejores glampings de Colombia.',
  alternates: { canonical: '/auth/registro' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
