'use client'

import { create } from 'zustand'
import type { FiltrosHome } from '@/types'

interface SearchState {
  filtros: FiltrosHome
  setFiltros: (f: Partial<FiltrosHome>) => void
  resetFiltros: () => void
}

const defaultFiltros: FiltrosHome = {
  page: 1,
  limit: 20,
  order_by: 'calificacion',
}

export const useSearchStore = create<SearchState>((set) => ({
  filtros: defaultFiltros,

  setFiltros: (f) =>
    set((state) => ({
      filtros: { ...state.filtros, ...f, page: f.page ?? 1 },
    })),

  resetFiltros: () => set({ filtros: defaultFiltros }),
}))
