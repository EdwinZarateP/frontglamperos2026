'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { AuthResponse, Usuario } from '@/types'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', creds)
      return data
    },
    onSuccess: (data) => {
      setAuth(data)
      toast.success(`¡Bienvenido, ${data.user.nombre.split(' ')[0]}!`)
      router.push('/')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const router = useRouter()

  return () => {
    logout()
    toast.success('Sesión cerrada')
    router.push('/')
  }
}

export function useMe() {
  const { isAuthenticated } = useAuthStore()
  return useQuery<Usuario>({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/usuarios/me')
      return data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  })
}
