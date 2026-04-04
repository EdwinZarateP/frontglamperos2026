'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Upload, Plus, Trash2, ChevronDown, CheckCircle, ChevronLeft,
  CreditCard, Banknote, ShieldCheck, AlertCircle, CalendarDays,
  Users, PawPrint, X, Info,
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useGlamping, useCotizacion, useFechasBloqueadas } from '@/hooks/useGlampings'
import { Input, Textarea } from '@/components/ui/Input'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { SingleDatePicker } from '@/components/ui/SingleDatePicker'
import { formatCOP, formatDate, calcularComision, colombianHolidays } from '@/lib/utils'
import type { Reserva } from '@/types'

// ─── Schema ──────────────────────────────────────────────────────────────────
const schema = z.object({
  nombreTitular: z.string().min(3, 'Nombre requerido'),
  cedulaTitular: z.string().min(5, 'Cédula requerida'),
  celularTitular: z.string().min(10, 'Celular requerido'),
  emailTitular: z.string().email('Email inválido'),
  notasEspeciales: z.string().optional(),
})

type FormData = {
  nombreTitular: string
  cedulaTitular: string
  celularTitular: string
  emailTitular: string
  notasEspeciales?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function precioMaxTarifas(tarifas?: Record<string, number>, fallback = 0): number {
  if (!tarifas) return fallback
  const vals = Object.values(tarifas).filter((v) => typeof v === 'number' && v > 0)
  return vals.length ? Math.max(...vals) : fallback
}

function getPasadiaPrice(glamping: Record<string, unknown>, fecha: string): number {
  if (!fecha) return 0
  const date = new Date(fecha + 'T12:00:00')
  const year = date.getFullYear()
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  const dayOfWeek = date.getDay() // 0=domingo, 6=sabado
  const tarifas = glamping.tarifasPasadia as Record<string, number> | undefined

  // Festivo o fin de semana → tarifa sábado
  const esFestivo = colombianHolidays(year).has(fecha)
  const esFinDeSemanaOFestivo = dayOfWeek === 0 || dayOfWeek === 6 || esFestivo
  const dayName = esFinDeSemanaOFestivo ? 'sabado' : days[dayOfWeek]

  const precioAnfitrion = (tarifas && tarifas[dayName] && tarifas[dayName] > 0)
    ? tarifas[dayName]
    : (glamping.precioNoche as number) || 0

  return Math.round(calcularComision(precioAnfitrion))
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReservarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const [fechaInicio, setFechaInicio] = useState(searchParams.get('fechaInicio') || '')
  const [fechaFin, setFechaFin]       = useState(searchParams.get('fechaFin') || '')
  const [huespedes, setHuespedes]     = useState(Number(searchParams.get('huespedes') || 2))
  const [cantidadMascotas, setCantidadMascotas] = useState(Number(searchParams.get('mascotas') || 0))
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<string[]>(
    (searchParams.get('extras') || '').split(',').filter(Boolean)
  )
  const tipoFijoPorUrl = searchParams.get('tipo') === 'PASADIA'
  // Ocultar el selector si ya vienen fechas de noche en la URL
  const ocultarSelectorTipo = tipoFijoPorUrl || !!searchParams.get('fechaInicio')
  const [tipo, setTipo]                     = useState<'NOCHES' | 'PASADIA'>(tipoFijoPorUrl ? 'PASADIA' : 'NOCHES')
  const [fechaPasadia, setFechaPasadia]     = useState(searchParams.get('fecha') || '')
  const [showCalendar, setShowCalendar]     = useState(!searchParams.get('fechaInicio'))
  const [showDetalles, setShowDetalles]     = useState(false)
  const [tieneMascota, setTieneMascota]     = useState(false)
  const [metodoPago, setMetodoPago]         = useState<'transferencia' | 'wompi'>('transferencia')
  const [porcentajeAbono, setPorcentajeAbono] = useState<50 | 100 | null>(100)
  const [montoManual, setMontoManual]       = useState('')
  const [comprobante, setComprobante]       = useState<File | null>(null)
  const [acompanantes, setAcompanantes]     = useState<{ nombreCompleto: string; telefono: string }[]>([])
  const [showResumenMobile, setShowResumenMobile] = useState(false)

  const { data: glamping, isLoading } = useGlamping(id)
  const { data: fechasBloqueadas = [] } = useFechasBloqueadas(id)
  const extrasStr = extrasSeleccionados.join(',')

  const { data: cotizacion } = useCotizacion(id, {
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    huespedes,
    extras: extrasStr || undefined,
  })

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<FormData>({
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
      fd.append('tipo', tipo)
      if (tipo === 'NOCHES') {
        fd.append('fechaInicio', fechaInicio)
        fd.append('fechaFin', fechaFin)
      } else {
        fd.append('fecha', fechaPasadia)
      }
      fd.append('huespedes', String(huespedes))
      fd.append('huespedesAdicionales', '0')
      fd.append('extrasSeleccionados', extrasStr)
      fd.append('cantidadMascotas', String(cantidadMascotas))
      fd.append('nombreTitular', data.nombreTitular)
      fd.append('cedulaTitular', data.cedulaTitular)
      fd.append('celularTitular', data.celularTitular)
      fd.append('emailTitular', data.emailTitular)
      fd.append('notasEspeciales', data.notasEspeciales || '')
      fd.append('metodoPago', metodoPago)
      const montoAbono = metodoPago === 'transferencia' && totalBase > 0
        ? (montoManual !== '' ? Number(montoManual) : Math.round(totalBase * (porcentajeAbono ?? 100) / 100))
        : 0
      fd.append('montoPagado', String(montoAbono))
      if (acompanantes.length > 0) fd.append('acompanantes', JSON.stringify(acompanantes))
      if (comprobante) fd.append('comprobante', comprobante)
      const res = await api.post<Reserva>('/reservas/', fd)
      return res.data
    },
    onSuccess: (reserva) => {
      if (metodoPago === 'wompi') {
        const porcentaje = porcentajeAbono || 100
        const apiUrl = process.env.NEXT_PUBLIC_API_URL
        window.location.href = `${apiUrl}/pagos/wompi/checkout/${reserva._id}?porcentaje=${porcentaje}`
      } else {
        toast.success('¡Solicitud enviada! Recibirás confirmación por email')
        router.push(`/mis-reservas?nueva=${reserva._id}`)
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const onFormSubmit = (data: FormData) => {
    if (tipo === 'NOCHES' && !hayFechas) { toast.error('Selecciona las fechas'); return }
    if (tipo === 'PASADIA' && !fechaPasadia) { toast.error('Selecciona la fecha del pasadía'); return }
    if (metodoPago === 'transferencia') {
      if (!comprobante) {
        toast.error('Debes adjuntar el comprobante de pago')
        return
      }
      if (totalBase > 0) {
        const monto = montoManual !== '' ? Number(montoManual) : Math.round(totalBase * (porcentajeAbono ?? 100) / 100)
        const minimo = Math.round(totalBase * 0.5)
        if (monto < minimo) {
          toast.error(`El monto mínimo es el 50%: ${formatCOP(minimo)}`)
          return
        }
      }
    }
    crearReserva.mutate(data)
  }

  const toggleExtra = useCallback((key: string) => {
    setExtrasSeleccionados((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }, [])

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    const qs = searchParams.toString()
    const redirectTo = `/glamping/${id}/reservar${qs ? `?${qs}` : ''}`
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
    return null
  }
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
  if (!glamping) return <div className="p-8 text-center text-stone-500">Glamping no encontrado</div>

  // ─── Derived values ────────────────────────────────────────────────────────
  const maxHuespedes      = glamping.cantidadHuespedes + (glamping.cantidadHuespedesAdicionales ?? 0)
  const extrasDisponibles = glamping.extras?.filter((e) => e.disponible) ?? []
  const precioDefecto     = precioMaxTarifas(glamping.tarifasNoche as Record<string, number> | undefined, glamping.precioNoche)
  const noches            = cotizacion?.noches ?? 0
  const precioMascota     = tieneMascota && glamping.aceptaMascotas ? Math.round((glamping.precioMascotas ?? 0) * Math.max(noches, 1) * 1.10) : 0
  const hayFechas         = !!fechaInicio && !!fechaFin
  // Precios pasadía para la leyenda del calendario (con comisión Glamperos)
  const tarifasPasadia = glamping.tarifasPasadia as Record<string, number> | undefined
  const _pasadiaDiaSemanaBase = tarifasPasadia?.lunes || tarifasPasadia?.martes || 0
  const pasadiaDiaSemana = _pasadiaDiaSemanaBase > 0 ? Math.round(calcularComision(_pasadiaDiaSemanaBase)) : undefined
  const _pasadiaFinDeSemanaBase = tarifasPasadia?.sabado || (glamping.precioNoche as number) || 0
  const pasadiaFinDeSemana = _pasadiaFinDeSemanaBase > 0 ? Math.round(calcularComision(_pasadiaFinDeSemanaBase)) : undefined
  // Festivos para los dos próximos años (cubre siempre el rango del calendario)
  const now = new Date()
  const festivosSet = new Set([
    ...colombianHolidays(now.getFullYear()),
    ...colombianHolidays(now.getFullYear() + 1),
  ])

  const totalBase         = tipo === 'PASADIA'
    ? (fechaPasadia ? getPasadiaPrice(glamping as unknown as Record<string, unknown>, fechaPasadia) : 0)
    : (cotizacion ? cotizacion.total + precioMascota : 0)
  // Redondear al múltiplo de 50 (denominación mínima COP)
  const floor50 = (x: number) => Math.floor(x / 50) * 50
  const ceil50  = (x: number) => Math.ceil(x / 50) * 50
  // totalWompi: base redondeado abajo + fee redondeado arriba
  const wompiBase         = floor50(totalBase)
  const wompiFee          = ceil50(wompiBase * 0.05)
  const totalWompi        = wompiBase + wompiFee   // siempre múltiplo de 50
  const totalMostrar      = metodoPago === 'wompi' ? totalWompi : totalBase

  // Para el selector de porcentaje: el abono debe ser múltiplo de 50
  const wompiAbono50      = floor50(totalWompi * 0.5)
  const wompiAbono100     = totalWompi

  // ─── Componente resumen (reutilizado en desktop y mobile sheet) ────────────
  const ResumenContent = () => (
    <div className="space-y-1">
      {/* Imagen */}
      {glamping.imagenes?.[0] && (
        <img
          src={glamping.imagenes[0]}
          alt={glamping.nombreGlamping}
          className="w-full h-36 object-cover rounded-xl mb-4"
        />
      )}
      <p className="font-semibold text-stone-800 text-sm">{glamping.nombreGlamping}</p>
      <p className="text-xs text-stone-400 mb-3">{glamping.ciudadDepartamento}</p>

      {/* Fechas y huéspedes */}
      <div className="text-sm space-y-2 text-stone-600">
        {tipo === 'PASADIA' ? (
          <div className="flex justify-between">
            <span className="text-stone-400">Pasadía</span>
            <span className="font-medium">{fechaPasadia ? formatDate(fechaPasadia) : '—'}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-stone-400">Llegada</span>
              <span className="font-medium">{fechaInicio ? formatDate(fechaInicio) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Salida</span>
              <span className="font-medium">{fechaFin ? formatDate(fechaFin) : '—'}</span>
            </div>
          </>
        )}
        <div className="flex justify-between">
          <span className="text-stone-400">Huéspedes</span>
          <span className="font-medium">{huespedes}</span>
        </div>
        {tieneMascota && (
          <div className="flex justify-between text-emerald-700">
            <span className="flex items-center gap-1"><PawPrint size={12} /> Mascota</span>
            <span className="font-medium">Incluida</span>
          </div>
        )}
      </div>

      {/* Desglose cotización */}
      {tipo === 'PASADIA' && fechaPasadia ? (
        <div className="border-t border-stone-100 mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Pasadía</span>
            <span>{formatCOP(getPasadiaPrice(glamping as unknown as Record<string, unknown>, fechaPasadia))}</span>
          </div>
          {metodoPago === 'wompi' && (
            <div className="flex justify-between text-amber-600 text-xs">
              <span>Recargo Wompi (5%)</span>
              <span>+{formatCOP(wompiFee)}</span>
            </div>
          )}
          <hr className="border-stone-100" />
          <div className="flex justify-between font-bold text-stone-900 text-base">
            <span>Total</span>
            <span>{formatCOP(totalMostrar)}</span>
          </div>
          {metodoPago === 'wompi' && (
            <p className="text-xs text-amber-500 text-right">Incluye 5% comisión Wompi</p>
          )}
        </div>
      ) : cotizacion ? (
        <div className="border-t border-stone-100 mt-3 pt-3 space-y-2 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Alojamiento ({noches} {noches === 1 ? 'noche' : 'noches'})</span>
            <span>{formatCOP(cotizacion.subtotalAlojamiento)}</span>
          </div>
          {cotizacion.subtotalExtras > 0 && (
            <div className="flex justify-between text-stone-600">
              <span>Extras</span>
              <span>{formatCOP(cotizacion.subtotalExtras)}</span>
            </div>
          )}
          {precioMascota > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Tarifa mascota</span>
              <span>{formatCOP(precioMascota)}</span>
            </div>
          )}
          {metodoPago === 'wompi' && (
            <div className="flex justify-between text-amber-600 text-xs">
              <span>Recargo Wompi (5%)</span>
              <span>+{formatCOP(wompiFee)}</span>
            </div>
          )}
          <hr className="border-stone-100" />
          <div className="flex justify-between font-bold text-stone-900 text-base">
            <span>Total</span>
            <span>{formatCOP(totalMostrar)}</span>
          </div>
          {metodoPago === 'wompi' && (
            <p className="text-xs text-amber-500 text-right">Incluye 5% comisión Wompi</p>
          )}
          {metodoPago === 'transferencia' && totalBase > 0 && (() => {
            const abono = montoManual !== ''
              ? Number(montoManual)
              : Math.round(totalBase * (porcentajeAbono ?? 100) / 100)
            const saldo = totalBase - abono
            if (saldo <= 0) return null
            return (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2 mt-1 space-y-1">
                <div className="flex justify-between text-sm text-emerald-700 font-medium">
                  <span>Abono ahora</span>
                  <span>{formatCOP(abono)}</span>
                </div>
                <div className="flex justify-between text-xs text-stone-400">
                  <span>Resto al llegar</span>
                  <span>{formatCOP(saldo)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      ) : (
        <div className="border-t border-stone-100 mt-3 pt-3">
          {tipo === 'PASADIA' && !fechaPasadia ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
              <Info size={13} />
              <span>Selecciona la fecha del pasadía</span>
            </div>
          ) : !hayFechas ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
              <Info size={13} />
              <span>Selecciona fechas para ver el total exacto</span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-2">
              <Spinner />
            </div>
          )}
          <div className="mt-2 text-center">
            <p className="text-xs text-stone-400">Precio referencial</p>
            <p className="font-bold text-stone-900">
              {formatCOP(precioDefecto)}
              <span className="text-xs font-normal text-stone-400"> / noche para 2</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-5 transition-colors"
      >
        <ChevronLeft size={16} /> Volver al glamping
      </button>

      <h1 className="text-2xl font-bold text-stone-900 mb-1">Completa tu reserva</h1>
      <p className="text-stone-400 text-sm mb-7">{glamping.nombreGlamping} · {glamping.ciudadDepartamento}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Formulario (izquierda) ─────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="lg:col-span-2 space-y-5"
        >

          {/* PASO 1 — DATOS DEL TITULAR */}
          <Section title="1. Tus datos" highlight>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo"
                placeholder="María García"
                error={errors.nombreTitular?.message}
                {...register('nombreTitular')}
              />
              <Input
                label="Cédula / Pasaporte"
                placeholder="1020215062"
                error={errors.cedulaTitular?.message}
                {...register('cedulaTitular')}
              />
              <Controller
                name="celularTitular"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    label="Celular"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.celularTitular?.message}
                  />
                )}
              />
              <Input
                label="Email de contacto"
                type="email"
                placeholder="maria@email.com"
                error={errors.emailTitular?.message}
                {...register('emailTitular')}
              />
            </div>

            {/* Acompañantes */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-stone-700">Acompañantes <span className="text-stone-400 font-normal">(opcional)</span></p>
                <button
                  type="button"
                  onClick={() => setAcompanantes((p) => [...p, { nombreCompleto: '', telefono: '' }])}
                  className="flex items-center gap-1 text-xs text-emerald-700 font-medium hover:text-emerald-900 transition-colors"
                >
                  <Plus size={13} /> Agregar
                </button>
              </div>
              {acompanantes.map((a, i) => (
                <div key={i} className="flex gap-2 items-start mb-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nombre"
                      value={a.nombreCompleto}
                      onChange={(e) => setAcompanantes((prev) => prev.map((x, idx) => idx === i ? { ...x, nombreCompleto: e.target.value } : x))}
                    />
                    <Input
                      placeholder="+573001234567"
                      value={a.telefono}
                      onChange={(e) => setAcompanantes((prev) => prev.map((x, idx) => idx === i ? { ...x, telefono: e.target.value } : x))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setAcompanantes((prev) => prev.filter((_, idx) => idx !== i))}
                    className="mt-2 p-1.5 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Notas */}
            <div className="mt-3">
              <Textarea
                label="Notas especiales (opcional)"
                placeholder="¿Algún requerimiento? Alergias, celebraciones, horarios especiales..."
                {...register('notasEspeciales')}
              />
            </div>
          </Section>

          {/* PASO 2 — TU VIAJE */}
          <Section title="2. Tu viaje">

            {/* Selector de tipo (solo si el glamping permite pasadía Y no vino con fechas o tipo fijo por URL) */}
            {glamping.permitePasadia && !ocultarSelectorTipo && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setTipo('NOCHES')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    tipo === 'NOCHES'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  Por noches
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('PASADIA')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    tipo === 'PASADIA'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  Pasadía
                </button>
              </div>
            )}

            {/* Fechas */}
            <div className="mb-3">
              {tipo === 'PASADIA' ? (
                /* ── Selector de fecha única para pasadía ── */
                <div>
                  {(glamping.pasadiaHorarioInicio || glamping.pasadiaHorarioFin) && (
                    <p className="text-xs text-emerald-700 font-medium mb-2 ml-1">
                      Horario: {glamping.pasadiaHorarioInicio || ''}{glamping.pasadiaHorarioFin ? ` – ${glamping.pasadiaHorarioFin}` : ''}
                    </p>
                  )}
                  <SingleDatePicker
                    value={fechaPasadia}
                    onChange={setFechaPasadia}
                    blockedDates={fechasBloqueadas}
                    holidays={festivosSet}
                    precioDiaSemana={pasadiaDiaSemana}
                    precioFinDeSemana={pasadiaFinDeSemana}
                  />
                </div>
              ) : (
                /* ── Selector de rango de fechas para noches ── */
                <>
                  <button
                    type="button"
                    onClick={() => setShowCalendar((v) => !v)}
                    className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-stone-400 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays size={16} className="text-stone-400 group-hover:text-stone-600" />
                      <div>
                        <p className="text-xs text-stone-400 leading-none mb-0.5">Fechas</p>
                        <p className="text-sm font-medium text-stone-800">
                          {hayFechas
                            ? `${formatDate(fechaInicio)} → ${formatDate(fechaFin)} · ${noches} ${noches === 1 ? 'noche' : 'noches'}`
                            : 'Seleccionar fechas'}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-stone-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
                  </button>

                  {showCalendar && (
                    <div className="mt-2">
                      <DateRangePicker
                        startDate={fechaInicio}
                        endDate={fechaFin}
                        blockedDates={fechasBloqueadas}
                        holidays={festivosSet}
                        minNights={glamping.minimoNoches || 1}
                        onChange={(s, e) => {
                          setFechaInicio(s)
                          setFechaFin(e)
                          if (s && e) setShowCalendar(false)
                        }}
                        onClose={() => setShowCalendar(false)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Huéspedes */}
            <button
              type="button"
              onClick={() => setShowDetalles((v) => !v)}
              className="w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-stone-400 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Users size={16} className="text-stone-400 group-hover:text-stone-600" />
                <div>
                  <p className="text-xs text-stone-400 leading-none mb-0.5">Huéspedes</p>
                  <p className="text-sm font-medium text-stone-800">
                    {huespedes} {huespedes === 1 ? 'huésped' : 'huéspedes'}
                    {glamping.aceptaMascotas && tieneMascota ? ' · 🐾 Con mascota' : ''}
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-stone-400 transition-transform ${showDetalles ? 'rotate-180' : ''}`} />
            </button>

            {showDetalles && (
              <div className="border border-stone-200 rounded-xl p-4 space-y-4 mt-2">
                {/* Counter huéspedes */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-800">Huéspedes</p>
                    <p className="text-xs text-stone-400">Máximo {maxHuespedes}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setHuespedes((h) => Math.max(1, h - 1))}
                      className="w-9 h-9 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-700 hover:border-stone-600 text-lg font-light transition-colors disabled:opacity-40"
                      disabled={huespedes <= 1}
                    >
                      −
                    </button>
                    <span className="font-semibold text-stone-900 w-5 text-center">{huespedes}</span>
                    <button
                      type="button"
                      onClick={() => setHuespedes((h) => Math.min(maxHuespedes, h + 1))}
                      className="w-9 h-9 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-700 hover:border-stone-600 text-lg font-light transition-colors disabled:opacity-40"
                      disabled={huespedes >= maxHuespedes}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mascotas */}
                {glamping.aceptaMascotas && (
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <PawPrint size={16} className="text-stone-500" />
                      <div>
                        <p className="text-sm font-medium text-stone-800">¿Llevas mascota?</p>
                        {(glamping.precioMascotas ?? 0) > 0 && (
                          <p className="text-xs text-stone-400">
                            +{formatCOP(glamping.precioMascotas!)} / noche
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTieneMascota((v) => !v)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${tieneMascota ? 'bg-emerald-600' : 'bg-stone-200'}`}
                      aria-label="Toggle mascota"
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tieneMascota ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDetalles(false)}
                  className="w-full py-2 text-sm font-medium text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Listo
                </button>
              </div>
            )}
          </Section>

          {/* PASO 3 — SERVICIOS EXTRAS */}
          {extrasDisponibles.length > 0 && (
            <Section title="3. Agrega extras">
              <div className="space-y-2">
                {extrasDisponibles.map((extra) => {
                  const selected = extrasSeleccionados.includes(extra.key)
                  return (
                    <button
                      key={extra.key}
                      type="button"
                      onClick={() => toggleExtra(extra.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        selected ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected ? 'border-emerald-500 bg-emerald-500' : 'border-stone-300'
                        }`}>
                          {selected && <CheckCircle size={11} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-800">{extra.nombre}</p>
                          <p className="text-xs text-stone-400 capitalize">
                            {extra.unidad === 'por_persona' ? 'Por persona' : 'Por reserva'}
                            {extra.descripcion ? ` · ${extra.descripcion}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-stone-700 shrink-0 ml-4">
                        {formatCOP(extra.precioPublico)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {/* PASO 4 — MÉTODO DE PAGO */}
          <Section title={extrasDisponibles.length > 0 ? '4. ¿Cómo deseas pagar?' : '3. ¿Cómo deseas pagar?'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

              {/* Wompi */}
              <button
                type="button"
                onClick={() => setMetodoPago('wompi')}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  metodoPago === 'wompi' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {metodoPago === 'wompi' && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle size={11} className="text-white" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <CreditCard size={18} className="text-emerald-600" />
                  <span className="font-semibold text-stone-800 text-sm">Pago en línea</span>
                </div>
                <p className="text-xs text-stone-500 mb-2">Tarjeta débito/crédito · PSE · Efecty</p>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 w-full">
                  <AlertCircle size={11} className="text-amber-500 shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">+5% recargo Wompi</span>
                </div>
                {hayFechas && cotizacion && (
                  <p className="mt-2 text-sm font-bold text-stone-900">{formatCOP(totalWompi)}</p>
                )}
              </button>

              {/* Transferencia */}
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
                  metodoPago === 'transferencia' ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {metodoPago === 'transferencia' && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle size={11} className="text-white" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <Banknote size={18} className="text-emerald-600" />
                  <span className="font-semibold text-stone-800 text-sm">Transferencia</span>
                </div>
                <p className="text-xs text-stone-500 mb-2">Nequi · Daviplata · Banco</p>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 w-full">
                  <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-700 font-medium">Sin recargo adicional</span>
                </div>
                {hayFechas && cotizacion && (
                  <p className="mt-2 text-sm font-bold text-stone-900">{formatCOP(totalBase)}</p>
                )}
              </button>
            </div>

            {/* Selector de porcentaje — Wompi */}
            {metodoPago === 'wompi' && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-stone-700 mb-2">¿Cuánto deseas pagar ahora?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([50, 100] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPorcentajeAbono(p)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          porcentajeAbono === p
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <p className="text-sm font-semibold text-stone-800">
                          {p === 50 ? '50% — Abono' : '100% — Pago total'}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {p === 50 ? 'Resto al llegar' : 'Sin saldo pendiente'}
                        </p>
                        {hayFechas && cotizacion && (
                          <p className="text-sm font-bold text-amber-600 mt-1">
                            {formatCOP(p === 50 ? wompiAbono50 : wompiAbono100)}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600 flex items-start gap-2">
                  <CreditCard size={13} className="shrink-0 mt-0.5 text-blue-500" />
                  <span>Serás redirigido a Wompi para pagar con tarjeta, PSE, Efecty o Baloto. El recargo del 5% es cobrado por la pasarela.</span>
                </div>
              </div>
            )}

            {/* Instrucciones transferencia */}
            {metodoPago === 'transferencia' && (
              <div className="space-y-3">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <p className="font-medium text-sm mb-1 flex items-center gap-2 text-stone-700">
                    <Banknote size={14} /> Instrucciones
                  </p>
                  <p className="text-xs text-stone-500">
                    El anfitrión te enviará los datos bancarios al confirmar tu reserva.
                    Puedes abonar el 50% ahora y el resto al llegar, o pagar el total.
                  </p>
                </div>

                {/* Opciones rápidas 50% / 100% */}
                <div>
                  <p className="text-sm font-medium text-stone-700 mb-2">¿Cuánto deseas abonar?</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {([50, 100] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setPorcentajeAbono(p); setMontoManual('') }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          porcentajeAbono === p && montoManual === ''
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <p className="text-sm font-semibold text-stone-800">
                          {p === 50 ? '50% — Abono' : '100% — Pago total'}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {p === 50 ? 'Resto al llegar' : 'Sin saldo pendiente'}
                        </p>
                        {hayFechas && cotizacion && (
                          <p className="text-sm font-bold text-emerald-700 mt-1">
                            {formatCOP(Math.round(totalBase * p / 100))}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Monto personalizado */}
                  <div>
                    <label className="text-xs text-stone-500 block mb-1">
                      O ingresa un monto específico {hayFechas && cotizacion && totalBase > 0 && (
                        <span className="text-stone-400">(mínimo {formatCOP(Math.round(totalBase * 0.5))})</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={totalBase > 0 ? Math.round(totalBase * 0.5) : 0}
                      max={totalBase > 0 ? totalBase : undefined}
                      placeholder="Ingresa el monto en COP"
                      value={montoManual}
                      onChange={(e) => { setMontoManual(e.target.value); setPorcentajeAbono(null) }}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Comprobante — obligatorio */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-1.5">
                    Comprobante de pago <span className="text-red-500">*</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${
                    comprobante
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-stone-300 bg-stone-50 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}>
                    <Upload size={20} className={comprobante ? 'text-emerald-500 mb-1.5' : 'text-stone-400 mb-1.5'} />
                    <span className="text-xs text-stone-600 text-center font-medium">
                      {comprobante ? comprobante.name : 'Adjunta el comprobante · Imagen o PDF · máx 10MB'}
                    </span>
                    {!comprobante && (
                      <span className="text-xs text-stone-400 mt-0.5">Requerido para confirmar tu abono</span>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
            )}
          </Section>

          {/* Botón submit — visible en desktop */}
          <div className="hidden lg:block">
            <SubmitButton
              metodoPago={metodoPago}
              loading={crearReserva.isPending}
              disabled={!hayFechas}
            />
            <SubmitNote metodoPago={metodoPago} />
          </div>
        </form>

        {/* ── Resumen sticky (desktop) ───────────────────────────────────── */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sticky top-20">
            <h2 className="font-semibold text-stone-800 mb-4">Resumen</h2>
            <ResumenContent />
          </div>
        </div>
      </div>

      {/* ── Barra fija mobile (bottom) ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-3 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowResumenMobile(true)}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          <div className="min-w-0">
            <p className="text-xs text-stone-400 leading-none">
              {hayFechas && cotizacion ? `${noches} ${noches === 1 ? 'noche' : 'noches'}` : 'Total estimado'}
            </p>
            <p className="font-bold text-stone-900 text-sm flex items-center gap-1">
              {hayFechas && cotizacion ? formatCOP(totalMostrar) : `Desde ${formatCOP(precioDefecto)}`}
              <ChevronDown size={14} className="text-stone-400" />
            </p>
          </div>
        </button>
        <SubmitButton
          metodoPago={metodoPago}
          loading={crearReserva.isPending}
          disabled={!hayFechas}
          onClickOverride={() => {
            if (!hayFechas) { setShowCalendar(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
            document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
          }}
          compact
        />
      </div>

      {/* ── Sheet resumen mobile ───────────────────────────────────────────── */}
      {showResumenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowResumenMobile(false)} />
          <div className="relative bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Resumen de tu reserva</h2>
              <button
                onClick={() => setShowResumenMobile(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X size={18} />
              </button>
            </div>
            <ResumenContent />
            <div className="mt-5">
              <SubmitButton
                metodoPago={metodoPago}
                loading={crearReserva.isPending}
                disabled={!hayFechas}
                onClickOverride={() => {
                  setShowResumenMobile(false)
                  if (!hayFechas) { setShowCalendar(true); return }
                  document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
                }}
              />
              <SubmitNote metodoPago={metodoPago} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200'}`}>
      <h2 className={`font-semibold mb-4 ${highlight ? 'text-emerald-800' : 'text-stone-800'}`}>{title}</h2>
      {children}
    </div>
  )
}

function SubmitButton({
  metodoPago,
  loading,
  disabled,
  onClickOverride,
  compact = false,
}: {
  metodoPago: 'wompi' | 'transferencia'
  loading: boolean
  disabled: boolean
  onClickOverride?: () => void
  compact?: boolean
}) {
  return (
    <Button
      type={onClickOverride ? 'button' : 'submit'}
      onClick={onClickOverride}
      fullWidth={!compact}
      size={compact ? 'sm' : 'lg'}
      loading={loading}
      disabled={disabled}
      className="bg-brand hover:bg-brand-hover text-white"
    >
      {metodoPago === 'wompi' ? (
        <span className="flex items-center gap-2">
          <CreditCard size={15} />
          {compact ? 'Pagar' : 'Reservar y pagar en línea'}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Banknote size={15} />
          {compact ? 'Enviar' : 'Enviar solicitud de reserva'}
        </span>
      )}
    </Button>
  )
}

function SubmitNote({ metodoPago }: { metodoPago: 'wompi' | 'transferencia' }) {
  return (
    <p className="text-xs text-stone-400 text-center mt-2">
      {metodoPago === 'wompi'
        ? 'Serás redirigido a Wompi para completar el pago de forma segura.'
        : 'Tu solicitud quedará pendiente hasta que el admin la confirme. Recibirás email y WhatsApp.'}
    </p>
  )
}