import { Suspense } from 'react'
import { Loader } from 'lucide-react'
import SistemaConfigClient from './SistemaConfigClient'

export default function SistemaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Configuración del Sistema</h1>
        <p className="text-stone-500 mt-1">Gestiona las configuraciones globales de la plataforma</p>
      </div>

      <Suspense fallback={<Loader className="animate-spin text-brand" size={32} />}>
        <SistemaConfigClient />
      </Suspense>
    </div>
  )
}
