import type { Metadata } from 'next'
import AdminLayoutClient from './AdminLayoutClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Panel de Administración | Glamperos',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
