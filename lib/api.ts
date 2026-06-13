import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Adjunta el token JWT automáticamente si existe
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Manejo global de errores 401 → logout limpio del store y redirección a login.
// Se omite la redirección si ya estamos en una ruta /auth/* (login/registro/callback)
// para no interrumpir esos flujos. El logout() limpia el estado de Zustand
// (clave glamperos-auth en localStorage) y el token suelto.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout()
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Error inesperado'
    )
  }
  return 'Error inesperado'
}
