'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, Plus, Trash2 } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGlamping, useCotizacion } from '@/hooks/useGlampings'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatCOP, formatDate } from '@/lib/utils'
import type { Reserva } from '@/types'

const schema = z.object({
  nombreTitular: z.string().min(3, 'Nombre requerido'),
  cedulaTitular: z.string().min(5, 'Cédula requerida'),
  celularTitular: z.string().min(10, 'Celular requerido'),
  emailTitular: z.string().email('Email inválido'),
  notasEspeciales: z.string().optional(),
  montoPagado: z.coerce.number().min(0).optional().default(0),
})

type FormData = {
  nombreTitular: string
  cedulaTitular: string
  celularTitular: string
  emailTitular: string
  notasEspeciales?: string
  montoPagado: number
}

export default function ReservarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const fechaInicio = searchParams.get('fechaInicio') || ''
  const fechaFin = searchParams.get('fechaFin') || ''
  const huespedes = Number(searchParams.get('huespedes') || 1)
  const extrasStr = searchParams.get('extras') || ''

  const { data: glamping, isLoading: loadingGlamping } = useGlamping(id)
  const { data: cotizacion } = useCotizacion(id, {
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    huespedes,
    extras: extrasStr || undefined,
  })

  const [comprobante, setComprobante] = useState<File | null>(null)
  const [acompanantes, setAcompanantes] = useState<{ nombreCompleto: string; telefono: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({ resolver: zodResolver(schema) as import('react-hook-form').Resolver<FormData> })

  // Pre-llenar con datos del usuario
  useEffect(() => {
    if (user) {
      setValue('nombreTitular', user.nombre || '')
      setValue('emailTitular', (user as { email?: string }).email || '')
    }
  }, [user, setValue])

  const crearReserva = useMutation({
    mutationFn: async (data: FormData) => {
      const fd = new FormData()
      fd.append('glampingId', id)
      fd.append('tipo', 'NOCHES')
      fd.append('fechaInicio', fechaInicio)
      fd.append('fechaFin', fechaFin)
      fd.append('huespedes', String(huespedes))
      fd.append('huespedesAdicionales', '0')
      fd.append('extrasSeleccionados', extrasStr)
      fd.append('nombreTitular', data.nombreTitular)
      fd.append('cedulaTitular', data.cedulaTitular)
      fd.append('celularTitular', data.celularTitular)
      fd.append('emailTitular', data.emailTitular)
      fd.append('notasEspeciales', data.notasEspeciales || '')
      fd.append('montoPagado', String(data.montoPagado || 0))
      if (acompanantes.length > 0) {
        fd.append('acompanantes', JSON.stringify(acompanantes))
      }
      if (comprobante) {
        fd.append('comprobante', comprobante)
      }
      const res = await api.post<Reserva>('/reservas/', fd)
      return res.data
    },
    onSuccess: (reserva) => {
      toast.success('¡Solicitud enviada! Recibirás confirmación por email')
      router.push(`/mis-reservas?nueva=${reserva._id}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const addAcompanante = () => {
    setAcompanantes((prev) => [...prev, { nombreCompleto: '', telefono: '' }])
  }

  const removeAcompanante = (i: number) => {
    setAcompanantes((prev) => prev.filter((_, idx) => idx !== i))
  }

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  if (loadingGlamping) return <Spinner />
  if (!glamping) return <div className="p-8 text-center">Glamping no encontrado</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Completa tu reserva</h1>
      <p className="text-stone-500 mb-8">{glamping.nombreGlamping} · {glamping.ciudadDepartamento}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <form
          onSubmit={handleSubmit((d) => crearReserva.mutate(d))}
          className="lg:col-span-2 space-y-6"
        >
          {/* Datos del titular */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Datos del titular</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                placeholder="María García"
                error={errors.nombreTitular?.message}
                {...register('nombreTitular')}
              />
              <Input
                label="Cédula / Pasaporte"
                placeholder="1010213062"
                error={errors.cedulaTitular?.message}
                {...register('cedulaTitular')}
              />
              <Input
                label="Celular (con indicativo)"
                placeholder="+573001234567"
                error={errors.celularTitular?.message}
                {...register('celularTitular')}
              />
              <Input
                label="Email de contacto"
                type="email"
                placeholder="maria@email.com"
                error={errors.emailTitular?.message}
                {...register('emailTitular')}
              />
            </div>
          </div>

          {/* Acompañantes */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Acompañantes (opcional)</h2>
              <Button type="button" variant="outline" size="sm" onClick={addAcompanante}>
                <Plus size={14} /> Agregar
              </Button>
            </div>
            {acompanantes.length === 0 && (
              <p className="text-sm text-stone-400">No has agregado acompañantes</p>
            )}
            {acompanantes.map((a, i) => (
              <div key={i} className="flex gap-3 items-start mb-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nombre completo"
                    value={a.nombreCompleto}
                    onChange={(e) =>
                      setAcompanantes((prev) =>
                        prev.map((x, idx) => idx === i ? { ...x, nombreCompleto: e.target.value } : x)
                      )
                    }
                  />
                  <Input
                    placeholder="+573001234567"
                    value={a.telefono}
                    onChange={(e) =>
                      setAcompanantes((prev) =>
                        prev.map((x, idx) => idx === i ? { ...x, telefono: e.target.value } : x)
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAcompanante(i)}
                  className="mt-2 p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Notas */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Notas especiales</h2>
            <Textarea
              placeholder="¿Algún requerimiento especial? Alergias, celebraciones, etc."
              {...register('notasEspeciales')}
            />
          </div>

          {/* Comprobante de pago */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-1">Comprobante de pago</h2>
            <p className="text-sm text-stone-400 mb-4">
              Adjunta el comprobante si ya realizaste un pago. También puedes pagar en línea después.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Monto abonado (COP)"
                type="number"
                placeholder="0"
                min={0}
                {...register('montoPagado')}
              />
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">
                  Comprobante (imagen/PDF)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-4 cursor-pointer hover:border-emerald-400 transition-colors">
                  <Upload size={20} className="text-stone-400 mb-2" />
                  <span className="text-xs text-stone-400">
                    {comprobante ? comprobante.name : 'Seleccionar archivo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={crearReserva.isPending}
          >
            Enviar solicitud de reserva
          </Button>

          <p className="text-xs text-stone-400 text-center">
            Tu solicitud quedará PENDIENTE hasta que el administrador la confirme. Recibirás un email y WhatsApp.
          </p>
        </form>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-20">
            <h2 className="font-semibold text-stone-800 mb-4">Resumen</h2>

            {glamping.imagenes?.[0] && (
              <img
                src={glamping.imagenes[0]}
                alt={glamping.nombreGlamping}
                className="w-full h-36 object-cover rounded-xl mb-4"
              />
            )}

            <p className="font-semibold text-stone-800 text-sm">{glamping.nombreGlamping}</p>
            <p className="text-xs text-stone-400 mb-4">{glamping.ciudadDepartamento}</p>

            <div className="text-sm space-y-1 text-stone-600 mb-4">
              <div className="flex justify-between">
                <span>Llegada</span>
                <span className="font-medium">{fechaInicio ? formatDate(fechaInicio) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Salida</span>
                <span className="font-medium">{fechaFin ? formatDate(fechaFin) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Huéspedes</span>
                <span className="font-medium">{huespedes}</span>
              </div>
            </div>

            {extrasStr && glamping.extras?.length > 0 && (
              <div className="border-t border-stone-100 pt-3 pb-1">
                <p className="text-xs font-medium text-stone-500 mb-2">Extras seleccionados</p>
                {extrasStr.split(',').filter(Boolean).map((key) => {
                  const extra = glamping.extras.find((e) => e.key === key)
                  if (!extra) return null
                  return (
                    <div key={key} className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>{extra.nombre}</span>
                      <span>{formatCOP(extra.precioPublico)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {cotizacion && (
              <div className="border-t border-stone-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Alojamiento</span>
                  <span>{formatCOP(cotizacion.subtotalAlojamiento)}</span>
                </div>
                {cotizacion.subtotalExtras > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal extras</span>
                    <span>{formatCOP(cotizacion.subtotalExtras)}</span>
                  </div>
                )}
                <hr className="border-stone-100" />
                <div className="flex justify-between font-bold text-stone-900 text-base">
                  <span>Total</span>
                  <span>{formatCOP(cotizacion.precioTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
