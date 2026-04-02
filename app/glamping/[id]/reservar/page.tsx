'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, Plus, Trash2, Dog, ChevronDown, CheckCircle, Pencil, X, CreditCard, Banknote, ShieldCheck, AlertCircle } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGlamping, useCotizacion, useFechasBloqueadas } from '@/hooks/useGlampings'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
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

  // ── Estado editable (inicializado desde URL params) ─────────────────────────
  const [editFechaInicio, setEditFechaInicio] = useState(searchParams.get('fechaInicio') || '')
  const [editFechaFin, setEditFechaFin] = useState(searchParams.get('fechaFin') || '')
  const [editHuespedes, setEditHuespedes] = useState(Number(searchParams.get('huespedes') || 2))
  const [tieneMascota, setTieneMascota] = useState(searchParams.get('mascota') === '1')
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<string[]>(
    (searchParams.get('extras') || '').split(',').filter(Boolean)
  )
  const [showCalendar, setShowCalendar] = useState(!searchParams.get('fechaInicio'))
  const [editingDetails, setEditingDetails] = useState(false)

  const { data: glamping, isLoading: loadingGlamping } = useGlamping(id)
  const { data: fechasBloqueadas = [] } = useFechasBloqueadas(id)

  const extrasStr = extrasSeleccionados.join(',')
  const { data: cotizacion } = useCotizacion(id, {
    fecha_inicio: editFechaInicio,
    fecha_fin: editFechaFin,
    huespedes: editHuespedes,
    extras: extrasStr || undefined,
  })

  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'wompi'>('transferencia')
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [acompanantes, setAcompanantes] = useState<{ nombreCompleto: string; telefono: string }[]>([])

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as import('react-hook-form').Resolver<FormData>,
  })

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
      fd.append('fechaInicio', editFechaInicio)
      fd.append('fechaFin', editFechaFin)
      fd.append('huespedes', String(editHuespedes))
      fd.append('huespedesAdicionales', '0')
      fd.append('extrasSeleccionados', extrasStr)
      fd.append('tieneMascota', tieneMascota ? '1' : '0')
      fd.append('nombreTitular', data.nombreTitular)
      fd.append('cedulaTitular', data.cedulaTitular)
      fd.append('celularTitular', data.celularTitular)
      fd.append('emailTitular', data.emailTitular)
      fd.append('notasEspeciales', data.notasEspeciales || '')
      fd.append('montoPagado', String(data.montoPagado || 0))
      if (acompanantes.length > 0) fd.append('acompanantes', JSON.stringify(acompanantes))
      if (comprobante) fd.append('comprobante', comprobante)
      const res = await api.post<Reserva>('/reservas/', fd)
      return res.data
    },
    onSuccess: (reserva) => {
      if (metodoPago === 'wompi') {
        toast.success('¡Reserva creada! Completa el pago con Wompi')
        router.push(`/pago/${reserva._id}`)
      } else {
        toast.success('¡Solicitud enviada! Recibirás confirmación por email')
        router.push(`/mis-reservas?nueva=${reserva._id}`)
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleExtra = (key: string) => {
    setExtrasSeleccionados((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }
  if (loadingGlamping) return <Spinner />
  if (!glamping) return <div className="p-8 text-center">Glamping no encontrado</div>

  const maxHuespedes = glamping.cantidadHuespedes + glamping.cantidadHuespedesAdicionales
  const extrasDisponibles = glamping.extras?.filter((e) => e.disponible) ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Completa tu reserva</h1>
      <p className="text-stone-500 mb-8">{glamping.nombreGlamping} · {glamping.ciudadDepartamento}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Formulario ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit((d) => crearReserva.mutate(d))} className="lg:col-span-2 space-y-6">

          {/* FECHAS Y DETALLES EDITABLES */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Tu viaje</h2>
              {!editingDetails && (
                <button
                  type="button"
                  onClick={() => setEditingDetails(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 underline"
                >
                  <Pencil size={13} /> Editar
                </button>
              )}
            </div>

            {/* Fechas */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Fechas</p>
              </div>

              {editingDetails || showCalendar ? (
                <div>
                  <DateRangePicker
                    startDate={editFechaInicio}
                    endDate={editFechaFin}
                    blockedDates={fechasBloqueadas}
                    minNights={glamping.minimoNoches || 1}
                    onChange={(s, e) => {
                      setEditFechaInicio(s)
                      setEditFechaFin(e)
                      if (s && e) setShowCalendar(false)
                    }}
                    onClose={() => { setShowCalendar(false); setEditingDetails(false) }}
                  />
                </div>
              ) : (
                <p className="text-sm font-medium text-stone-800">
                  {editFechaInicio ? `${formatDate(editFechaInicio)} → ${formatDate(editFechaFin)}` : (
                    <button type="button" onClick={() => setShowCalendar(true)} className="text-brand underline">
                      Seleccionar fechas
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Huéspedes */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Huéspedes</p>
              {editingDetails ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditHuespedes((h) => Math.max(1, h - 1))}
                    className="w-8 h-8 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-500 text-lg"
                  >
                    −
                  </button>
                  <span className="font-semibold text-stone-900 w-6 text-center">{editHuespedes}</span>
                  <button
                    type="button"
                    onClick={() => setEditHuespedes((h) => Math.min(maxHuespedes, h + 1))}
                    className="w-8 h-8 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-500 text-lg"
                  >
                    +
                  </button>
                  <span className="text-xs text-stone-400">(máx {maxHuespedes})</span>
                </div>
              ) : (
                <p className="text-sm font-medium text-stone-800">
                  {editHuespedes} {editHuespedes === 1 ? 'huésped' : 'huéspedes'}
                </p>
              )}
            </div>

            {/* Mascotas */}
            {glamping.aceptaMascotas && (
              <div className="flex items-center justify-between py-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <Dog size={15} className="text-stone-500" />
                  <p className="text-sm text-stone-700">¿Llevas mascota?</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTieneMascota((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${tieneMascota ? 'bg-brand' : 'bg-stone-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tieneMascota ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )}

            {editingDetails && (
              <button
                type="button"
                onClick={() => setEditingDetails(false)}
                className="mt-3 w-full py-2 text-sm font-medium text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Confirmar detalles
              </button>
            )}
          </div>

          {/* Servicios extras */}
          {extrasDisponibles.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="font-semibold text-stone-800 mb-4">Servicios extras</h2>
              <div className="space-y-3">
                {extrasDisponibles.map((extra) => {
                  const selected = extrasSeleccionados.includes(extra.key)
                  return (
                    <div
                      key={extra.key}
                      onClick={() => toggleExtra(extra.key)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selected ? 'border-brand bg-emerald-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selected ? 'border-brand bg-brand' : 'border-stone-300'
                        }`}>
                          {selected && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 text-sm">{extra.nombre}</p>
                          <p className="text-xs text-stone-400 capitalize">
                            {extra.unidad.replace(/_/g, ' ')}
                            {extra.descripcion && ` · ${extra.descripcion}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-stone-700 text-sm shrink-0 ml-3">
                        {formatCOP(extra.precioPublico)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* DATOS DEL TITULAR */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Datos del titular</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nombre completo" placeholder="María García" error={errors.nombreTitular?.message} {...register('nombreTitular')} />
              <Input label="Cédula / Pasaporte" placeholder="1010213062" error={errors.cedulaTitular?.message} {...register('cedulaTitular')} />
              <Input label="Celular (con indicativo)" placeholder="+573001234567" error={errors.celularTitular?.message} {...register('celularTitular')} />
              <Input label="Email de contacto" type="email" placeholder="maria@email.com" error={errors.emailTitular?.message} {...register('emailTitular')} />
            </div>
          </div>

          {/* ACOMPAÑANTES */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Acompañantes (opcional)</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => setAcompanantes((p) => [...p, { nombreCompleto: '', telefono: '' }])}>
                <Plus size={14} /> Agregar
              </Button>
            </div>
            {acompanantes.length === 0 && <p className="text-sm text-stone-400">No has agregado acompañantes</p>}
            {acompanantes.map((a, i) => (
              <div key={i} className="flex gap-3 items-start mb-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <Input placeholder="Nombre completo" value={a.nombreCompleto}
                    onChange={(e) => setAcompanantes((prev) => prev.map((x, idx) => idx === i ? { ...x, nombreCompleto: e.target.value } : x))} />
                  <Input placeholder="+573001234567" value={a.telefono}
                    onChange={(e) => setAcompanantes((prev) => prev.map((x, idx) => idx === i ? { ...x, telefono: e.target.value } : x))} />
                </div>
                <button type="button" onClick={() => setAcompanantes((prev) => prev.filter((_, idx) => idx !== i))} className="mt-2 p-2 text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* NOTAS */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">Notas especiales</h2>
            <Textarea placeholder="¿Algún requerimiento especial? Alergias, celebraciones, etc." {...register('notasEspeciales')} />
          </div>

          {/* MÉTODO DE PAGO */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-4">¿Cómo deseas pagar?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Opción Wompi */}
              <button
                type="button"
                onClick={() => setMetodoPago('wompi')}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  metodoPago === 'wompi'
                    ? 'border-brand bg-emerald-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {metodoPago === 'wompi' && (
                  <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                    <CheckCircle size={10} className="text-white" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard size={18} className="text-brand" />
                  <span className="font-semibold text-stone-800 text-sm">Pago en línea</span>
                </div>
                <p className="text-xs text-stone-500 mb-2">Tarjeta débito / crédito / PSE vía Wompi</p>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                  <AlertCircle size={11} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">Recargo del 5% por pasarela</span>
                </div>
                {cotizacion && metodoPago === 'wompi' && (
                  <p className="mt-2 text-sm font-bold text-stone-900">
                    Total: {formatCOP(Math.round(cotizacion.precioTotal * 1.05))}
                  </p>
                )}
              </button>

              {/* Opción Transferencia */}
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  metodoPago === 'transferencia'
                    ? 'border-brand bg-emerald-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {metodoPago === 'transferencia' && (
                  <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                    <CheckCircle size={10} className="text-white" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Banknote size={18} className="text-brand" />
                  <span className="font-semibold text-stone-800 text-sm">Transferencia / Efectivo</span>
                </div>
                <p className="text-xs text-stone-500 mb-2">Transfiere directamente al anfitrión</p>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                  <ShieldCheck size={11} className="text-brand shrink-0" />
                  <span className="text-xs text-brand-light font-medium">Sin comisión adicional</span>
                </div>
                {cotizacion && metodoPago === 'transferencia' && (
                  <p className="mt-2 text-sm font-bold text-stone-900">
                    Total: {formatCOP(cotizacion.precioTotal)}
                  </p>
                )}
              </button>
            </div>

            {/* Instrucciones según método */}
            {metodoPago === 'wompi' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-1 flex items-center gap-2">
                  <CreditCard size={14} /> Pago seguro con Wompi</p>
                <p className="text-xs text-blue-600">
                  Al enviar la solicitud serás redirigido a la pasarela de pago Wompi para completar el pago con tarjeta, PSE o efectivo (Efecty/Baloto). El recargo del 5% cubre los costos de la plataforma de pagos.
                </p>
              </div>
            )}

            {metodoPago === 'transferencia' && (
              <div className="space-y-3">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-700">
                  <p className="font-medium mb-1 flex items-center gap-2">
                    <Banknote size={14} /> Instrucciones de pago</p>
                  <p className="text-xs text-stone-500">
                    El anfitrión te enviará los datos bancarios al confirmar tu reserva. Adjunta aquí el comprobante si ya tienes uno.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Monto abonado (COP)" type="number" placeholder="0" min={0} {...register('montoPagado')} />
                  <div>
                    <label className="text-sm font-medium text-stone-700 block mb-1">Comprobante (imagen/PDF)</label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-xl p-4 cursor-pointer hover:border-emerald-400 transition-colors">
                      <Upload size={20} className="text-stone-400 mb-2" />
                      <span className="text-xs text-stone-400">{comprobante ? comprobante.name : 'Seleccionar archivo'}</span>
                      <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setComprobante(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" loading={crearReserva.isPending}
            disabled={!editFechaInicio || !editFechaFin}>
            {metodoPago === 'wompi' ? (
              <span className="flex items-center gap-2"><CreditCard size={16} /> Reservar y pagar en línea</span>
            ) : (
              <span className="flex items-center gap-2"><Banknote size={16} /> Enviar solicitud de reserva</span>
            )}
          </Button>
          <p className="text-xs text-stone-400 text-center">
            {metodoPago === 'wompi'
              ? 'Serás redirigido a Wompi para completar el pago de forma segura.'
              : 'Tu solicitud quedará PENDIENTE hasta que el administrador la confirme. Recibirás email y WhatsApp.'}
          </p>
        </form>

        {/* ── Resumen sticky ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-20">
            <h2 className="font-semibold text-stone-800 mb-4">Resumen</h2>

            {glamping.imagenes?.[0] && (
              <img src={glamping.imagenes[0]} alt={glamping.nombreGlamping} className="w-full h-36 object-cover rounded-xl mb-4" />
            )}

            <p className="font-semibold text-stone-800 text-sm">{glamping.nombreGlamping}</p>
            <p className="text-xs text-stone-400 mb-4">{glamping.ciudadDepartamento}</p>

            <div className="text-sm space-y-1.5 text-stone-600 mb-4">
              <div className="flex justify-between">
                <span>Llegada</span>
                <span className="font-medium">{editFechaInicio ? formatDate(editFechaInicio) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Salida</span>
                <span className="font-medium">{editFechaFin ? formatDate(editFechaFin) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Huéspedes</span>
                <span className="font-medium">{editHuespedes}</span>
              </div>
              {tieneMascota && (
                <div className="flex items-center gap-1 text-stone-500 text-xs">
                  <Dog size={12} /> Viaja con mascota
                </div>
              )}
            </div>

            {/* Extras seleccionados */}
            {extrasSeleccionados.length > 0 && extrasDisponibles.length > 0 && (
              <div className="border-t border-stone-100 pt-3 pb-1">
                <p className="text-xs font-medium text-stone-500 mb-2">Extras</p>
                {extrasSeleccionados.map((key) => {
                  const extra = extrasDisponibles.find((e) => e.key === key)
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

            {/* Cotización total */}
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
                {metodoPago === 'wompi' && (
                  <div className="flex justify-between text-amber-600 text-xs">
                    <span>Comisión Wompi (5%)</span>
                    <span>+{formatCOP(Math.round(cotizacion.precioTotal * 0.05))}</span>
                  </div>
                )}
                <hr className="border-stone-100" />
                <div className="flex justify-between font-bold text-stone-900 text-base">
                  <span>Total</span>
                  <span>
                    {metodoPago === 'wompi'
                      ? formatCOP(Math.round(cotizacion.precioTotal * 1.05))
                      : formatCOP(cotizacion.precioTotal)}
                  </span>
                </div>
                {metodoPago === 'wompi' && (
                  <p className="text-xs text-amber-600 text-center">Incluye 5% de comisión Wompi</p>
                )}
                {!cotizacion.disponible && (
                  <p className="text-red-500 text-xs font-medium text-center">
                    No disponible en esas fechas
                  </p>
                )}
              </div>
            )}

            {!editFechaInicio && (
              <p className="text-xs text-amber-600 text-center mt-2">Selecciona las fechas para ver el total</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
