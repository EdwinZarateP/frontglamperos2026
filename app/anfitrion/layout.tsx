import type { Metadata } from 'next'
import AnfitrionLayoutClient from './AnfitrionLayoutClient'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Panel de Anfitrión | Glamperos',
}

export default function AnfitrionLayout({ children }: { children: React.ReactNode }) {
  return <AnfitrionLayoutClient>{children}</AnfitrionLayoutClient>
}
