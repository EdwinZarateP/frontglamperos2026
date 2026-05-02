'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Loader } from 'lucide-react'

interface SistemaConfig {
  wompi_env: 'test' | 'prod'
}

export default function SistemaConfigClient() {
  const queryClient = useQueryClient()
  const { data: config, isLoading } = useQuery<SistemaConfig>({
    queryKey: ['sistema-config'],
    queryFn: async () => {
      const res = await api.get('/sistema/config')
      return res.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<SistemaConfig>) => {
      const res = await api.put('/sistema/config', updates)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sistema-config'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-brand" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wompi Environment */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Wompi - Pasarela de pagos</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-stone-800">Modo de Wompi</p>
              <p className="text-sm text-stone-500 mt-1">
                {config?.wompi_env === 'test'
                  ? 'Sandbox - Pruebas sin dinero real'
                  : 'Producción - Dinero real'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate({ wompi_env: 'test' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  config?.wompi_env === 'test'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Pruebas
              </button>
              <button
                onClick={() => updateMutation.mutate({ wompi_env: 'prod' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  config?.wompi_env === 'prod'
                    ? 'bg-blue-500 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Producción
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>Atención:</strong> Cambiar a modo Producción habilitará pagos reales con tarjeta de crédito.
              Asegúrate de que las llaves de producción estén configuradas correctamente.
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      {updateMutation.isPending && (
        <div className="bg-stone-50 rounded-lg p-3 text-center">
          <p className="text-sm text-stone-600">Guardando cambios...</p>
        </div>
      )}

      {updateMutation.isSuccess && (
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <p className="text-sm text-emerald-700">✓ Configuración actualizada correctamente</p>
        </div>
      )}

      {updateMutation.isError && (
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-sm text-red-700">✗ Error al actualizar la configuración</p>
        </div>
      )}
    </div>
  )
}
