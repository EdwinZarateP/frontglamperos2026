'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, Rol, Usuario } from '@/types'

interface AuthState {
  token: string | null
  user: AuthResponse['user'] | null
  isAuthenticated: boolean
  setAuth: (data: AuthResponse) => void
  logout: () => void
  updateUser: (data: Partial<Usuario>) => void
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (data) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.access_token)
        }
        set({
          token: data.access_token,
          user: data.user,
          isAuthenticated: true,
        })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : state.user,
        })),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'glamperos-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Selectores
export const useIsAdmin = () => useAuthStore((s) => s.user?.rol === 'admin')
export const useIsAnfitrion = () =>
  useAuthStore((s) => s.user?.rol === 'anfitrion' || s.user?.rol === 'admin')
