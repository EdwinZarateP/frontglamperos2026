'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Eye, ImageIcon } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { formatCOP } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface Props {
  params: Promise<{ id: string }>
}

const ESTADO: Record<string, { label: string; icon: React.ReactNode; className: string; desc: string }> = {
  pendiente: {
    label: 'En revisión',
    icon: <Clock size={18} />,
    className: 'bg-amber-50 border-amber-200 text-amber-700',
    desc: 'Tu glamping está siendo revisado por el equipo de Glamperos. Te notificaremos cuando sea aprobado.',
  },
  aprobado: {
    label: 'Publicado',
    icon: <CheckCircle size={18} />,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    desc: 'Tu glamping está visible en el catálogo y puede recibir reservas.',
  },
  rechazado: {
    label: 'Rechazado',
    icon: <XCircle size={18} />,
    className: 'bg-red-50 border-red-200 text-red-600',
    desc: 'Tu glamping fue rechazado. Revisa el motivo, corrígelo y vuelve a enviarlo.',
  },
}

export default function GlampingAnfitrionPage({ params }: Props) {
  const { id } = use(params)

  const { data: glamping, isLoading, error } = useQuery({
    queryKey: ['glamping-anfitrion', id],
    queryFn: async () => {
      const res = await api.get(`/glampings/${id}`)
      return res.data
    },
  })

  if (isLoading) return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  )

  if (error || !glamping) return (
    <div className="max-w-2xl">
      <p className="text-red-500 text-sm">{error ? getErrorMessage(error) : 'Glamping no encontrado'}</p>
      <Link href="/anfitrion/glampings" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">
        ← Volver a mis glampings
      </Link>
    </div>
  )

  const estado = glamping.estadoAprobacion ? ESTADO[glamping.estadoAprobacion] : null

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/anfitrion/glampings" className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-3">
          <ArrowLeft size={14} /> Mis glampings
        </Link>
        <h1 className="text-xl font-bold text-stone-900">{glamping.nombreGlamping}</h1>
        {glamping.nombrePropiedad && <p className="text-stone-400 text-sm">{glamping.nombrePropiedad}</p>}
      </div>

      {/* Banner de estado */}
      {estado && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${estado.className}`}>
          <div className="shrink-0 mt-0.5">{estado.icon}</div>
          <div>
            <p className="font-semibold">{estado.label}</p>
            <p className="text-sm mt-0.5 opacity-80">{estado.desc}</p>
            {glamping.estadoAprobacion === 'rechazado' && glamping.motivoRechazo && (
              <p className="text-sm mt-2 font-medium">Motivo: {glamping.motivoRechazo}</p>
            )}
          </div>
        </div>
      )}

      {/* Foto + datos básicos */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {glamping.imagenes?.[0] ? (
          <img src={glamping.imagenes[0]} alt="" className="w-full h-52 object-cover" />
        ) : (
          <div className="w-full h-52 bg-stone-100 flex items-center justify-center">
            <ImageIcon size={32} className="text-stone-300" />
          </div>
        )}
        <div className="p-4 space-y-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
            <span className="capitalize">{glamping.tipoGlamping}</span>
            <span className="flex items-center gap-1"><MapPin size={13} />{glamping.ciudadDepartamento}</span>
            <span className="font-medium text-stone-700">{formatCOP(glamping.precioNoche)} / noche</span>
          </div>
          <p className="text-sm text-stone-400 line-clamp-3">{glamping.descripcionGlamping}</p>
          <p className="text-xs text-stone-300">{glamping.imagenes?.length || 0} fotos · {glamping.amenidades?.length || 0} amenidades</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        {glamping.habilitado && (
          <Link
            href={`/glamping/${id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-600 text-sm font-medium hover:bg-emerald-50"
          >
            <Eye size={15} /> Ver página pública
          </Link>
        )}
        <Link
          href={`/anfitrion/glampings/nuevo`}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-900"
        >
          Publicar otro glamping
        </Link>
      </div>
    </div>
  )
}
