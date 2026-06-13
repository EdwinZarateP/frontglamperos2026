'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'
import { cargarTramosComision } from '@/lib/utils'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { isTokenExpired } from '@/lib/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => { cargarTramosComision() }, [])

  // Validar la sesión al hidratarse el store: si el token guardado ya expiró
  // o ya no es válido en el backend, hacer logout para que la UI no muestre
  // "logueado" con un token muerto (caso típico: volver días después y que el
  // JWT ya caducó). Ver también el interceptor de 401 en lib/api.ts.
  const sessionChecked = useRef(false)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  useEffect(() => {
    if (!hasHydrated || sessionChecked.current) return
    sessionChecked.current = true

    const { token, logout, updateUser } = useAuthStore.getState()
    if (!token) return

    // 1. Logout inmediato (sin red) si el exp local del JWT ya pasó.
    if (isTokenExpired(token)) {
      logout()
      return
    }

    // 2. Verificar contra el backend (cubre token invalidado por cambio de
    //    secret, usuario borrado, etc.) y refrescar el user con datos frescos.
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (data && (data.nombre || data.rol)) {
          updateUser({
            nombre: data.nombre,
            rol: data.rol,
            foto: data.foto,
          })
        }
      })
      .catch(() => {
        logout()
      })
  }, [hasHydrated])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </QueryClientProvider>
  )
}
