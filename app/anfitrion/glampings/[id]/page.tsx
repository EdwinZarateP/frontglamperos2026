'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Eye, ChevronDown, ChevronUp, Plus, Trash2, Link2, CalendarDays, Pencil, Check, X } from 'lucide-react'
import { tipoGlampingLabels, toTitleCase } from '@/lib/utils'
import { CATALOGO_EXTRAS, UNIDAD_LABELS } from '@/lib/catalogoExtras'
import { TipoGlampingIcon } from '@/components/ui/TipoGlampingIcon'
import { api, getErrorMessage } from '@/lib/api'
import { Input, Textarea } from '@/components/ui/Input'
import { CiudadAutocomplete } from '@/components/ui/CiudadAutocomplete'
import dynamic from 'next/dynamic'
const MapaPicker = dynamic(() => import('@/components/ui/MapaPicker').then(m => m.MapaPicker), { ssr: false })
import { FotosUpload, type ImagenItem } from '@/components/ui/FotosUpload'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'

const AMENIDADES_DISPONIBLES = [
  { id: 'wifi', label: 'Wifi' }, { id: 'parlante', label: 'Parlante' },
  { id: 'mascotas', label: 'Mascotas' }, { id: 'zona-de-trabajo', label: 'Zona de trabajo' },
  { id: 'coctel-bienvenida', label: 'Coctel bienvenida' }, { id: 'jacuzzi', label: 'Jacuzzi' },
  { id: 'sauna', label: 'Sauna' }, { id: 'tina', label: 'Tina' },
  { id: 'piscina', label: 'Piscina' }, { id: 'malla-catamaran', label: 'Malla catamarán' },
  { id: 'mesedora', label: 'Mesedora' }, { id: 'mesa-y-sillas', label: 'Mesa y sillas' },
  { id: 'zona-hamaca', label: 'Zona hamaca' }, { id: 'zona-masajes', label: 'Zona masajes' },
  { id: 'parrilla', label: 'Parrilla' }, { id: 'cocina', label: 'Cocina' },
  { id: 'zona-fogata', label: 'Zona fogata' }, { id: 'chimenea', label: 'Chimenea' },
  { id: 'servicio-restaurante', label: 'Servicio restaurante' },
  { id: 'incluye-desayuno', label: 'Incluye desayuno' },
  { id: 'incluye-almuerzo', label: 'Incluye almuerzo' },
  { id: 'incluye-cena', label: 'Incluye cena' },
  { id: 'servicio-cuatrimoto', label: 'Servicio cuatrimoto' },
  { id: 'mini-bar', label: 'Mini bar' }, { id: 'tv', label: 'TV' },
  { id: 'proyector', label: 'Proyector' }, { id: 'telescopio', label: 'Telescopio' },
  { id: 'toallas', label: 'Toallas' }, { id: 'jabon', label: 'Jabón' },
  { id: 'bano-privado', label: 'Baño privado' }, { id: 'bano-compartido', label: 'Baño compartido' },
  { id: 'juegos-de-mesa', label: 'Juegos de mesa' }, { id: 'lavadora', label: 'Lavadora' },
  { id: 'clima-calido', label: 'Clima cálido' }, { id: 'vista-al-lago', label: 'Vista al lago' },
  { id: 'ventilador', label: 'Ventilador' }, { id: 'aire-acondicionado', label: 'Aire acondicionado' },
  { id: 'clima-frio', label: 'Clima frío' }, { id: 'calefaccion', label: 'Calefacción' },
  { id: 'ducha', label: 'Ducha' }, { id: 'detector-de-humo', label: 'Detector de humo' },
  { id: 'extintor', label: 'Extintor' }, { id: 'botiquin', label: 'Botiquín' },
  { id: 'playa', label: 'Playa' }, { id: 'naturaleza', label: 'Naturaleza' },
  { id: 'rio', label: 'Río' }, { id: 'cascada', label: 'Cascada' },
  { id: 'en-la-montana', label: 'En la montaña' }, { id: 'desierto', label: 'Desierto' },
  { id: 'caminata', label: 'Caminata' }, { id: 'parqueadero', label: 'Parqueadero' },
]

const DIAS = [
  { key: 'lunes', label: 'Lunes' }, { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' }, { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' }, { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
] as const

type Dia = typeof DIAS[number]['key']

interface TarifaDiariaForm { lunes: number; martes: number; miercoles: number; jueves: number; viernes: number; sabado: number; domingo: number }
interface FormData {
  nombrePropiedad: string; nombreGlamping: string; tipoGlamping: string
  descripcionGlamping: string; ciudadDepartamento: string; direccion: string
  precioNoche: number; precioPersonaAdicional: number; cantidadHuespedes: number
  cantidadHuespedesAdicionales: number; minimoNoches: number; aceptaMascotas: boolean
  checkInNoche: string; checkOutNoche: string; precioMascotas: number
  permitePasadia: boolean; pasadiaHorarioInicio: string; pasadiaHorarioFin: string
  diasCancelacion: number; noCancelaciones: boolean; politicasCasa: string
  videoYoutube: string; tarifasNoche: TarifaDiariaForm; tarifasPasadia: TarifaDiariaForm
}

const TARIFA_VACIA: TarifaDiariaForm = { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0, domingo: 0 }

function buildTarifa(t: Record<string, number> | null | undefined): TarifaDiariaForm {
  if (!t) return { ...TARIFA_VACIA }
  return { lunes: t.lunes ?? 0, martes: t.martes ?? 0, miercoles: t.miercoles ?? 0, jueves: t.jueves ?? 0, viernes: t.viernes ?? 0, sabado: t.sabado ?? 0, domingo: t.domingo ?? 0 }
}
function tieneValores(t: TarifaDiariaForm) { return Object.values(t).some((v) => Number(v) > 0) }

interface Props { params: Promise<{ id: string }> }

interface UnidadItem {
  _id: string
  nombre: string
  numero: number
  urlIcal?: string
  urlIcalBooking?: string
  habilitada: boolean
}


export default function EditarGlampingPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [imagenes, setImagenes] = useState<ImagenItem[]>([])
  const imagenesOriginalesCount = useRef(0)
  const [amenidades, setAmenidades] = useState<string[]>([])
  const [extras, setExtras] = useState<Record<string, { precio: number; descripcion: string; unidad: string }>>({})
  const [ubicacion, setUbicacion] = useState({ lat: '', lng: '' })
  const [mostrarTarifasNoche, setMostrarTarifasNoche] = useState(false)
  const [mostrarTarifasPasadia, setMostrarTarifasPasadia] = useState(false)
  const [guardandoFotos, setGuardandoFotos] = useState(false)

  // Unidades
  const [editandoUnidad, setEditandoUnidad] = useState<string | null>(null)
  const [unidadForm, setUnidadForm] = useState({ nombre: '', urlIcal: '', urlIcalBooking: '' })
  const [agregandoUnidad, setAgregandoUnidad] = useState(false)
  const [nuevaUnidadNombre, setNuevaUnidadNombre] = useState('')


  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { minimoNoches: 1, cantidadHuespedes: 2, cantidadHuespedesAdicionales: 0, checkInNoche: '15:00', checkOutNoche: '12:00', aceptaMascotas: false, permitePasadia: false, pasadiaHorarioInicio: '08:00', pasadiaHorarioFin: '17:00', diasCancelacion: 15, noCancelaciones: false, tarifasNoche: { ...TARIFA_VACIA }, tarifasPasadia: { ...TARIFA_VACIA } },
  })

  const aceptaMascotas = watch('aceptaMascotas')
  const permitePasadia = watch('permitePasadia')
  const precioNocheBase = Number(watch('precioNoche')) || 0
  const noCancelaciones = watch('noCancelaciones')
  const huespedesAdicionales = Number(watch('cantidadHuespedesAdicionales')) || 0

  // Cargar glamping existente
  const { data: glamping, isLoading } = useQuery({
    queryKey: ['glamping-edit', id],
    queryFn: async () => { const { data } = await api.get(`/glampings/${id}`); return data },
    staleTime: 0,
  })

  useEffect(() => {
    if (!glamping) return
    setAmenidades(glamping.amenidades || [])
    setUbicacion({ lat: String(glamping.ubicacion?.lat || ''), lng: String(glamping.ubicacion?.lng || '') })
    if (glamping.imagenes?.length) {
      setImagenes(glamping.imagenes as string[])
      imagenesOriginalesCount.current = glamping.imagenes.length
    }
    if (glamping.extras?.length) {
      const map: Record<string, { precio: number; descripcion: string; unidad: string }> = {}
      for (const e of glamping.extras) {
        map[e.key] = { precio: e.precio ?? 0, descripcion: e.descripcion ?? '', unidad: e.unidad === 'por_grupo' ? 'por_pareja' : (e.unidad ?? 'por_pareja') }
      }
      setExtras(map)
    }
    const tn = buildTarifa(glamping.tarifasNoche)
    const tp = buildTarifa(glamping.tarifasPasadia)
    if (tieneValores(tn)) setMostrarTarifasNoche(true)
    if (tieneValores(tp)) setMostrarTarifasPasadia(true)
    reset({
      nombrePropiedad: glamping.nombrePropiedad || '',
      nombreGlamping: glamping.nombreGlamping || '',
      tipoGlamping: glamping.tipoGlamping || '',
      descripcionGlamping: glamping.descripcionGlamping || '',
      ciudadDepartamento: glamping.ciudadDepartamento || '',
      direccion: glamping.direccion || '',
      precioNoche: glamping.precioNoche || 0,
      precioPersonaAdicional: glamping.precioPersonaAdicional || 0,
      cantidadHuespedes: glamping.cantidadHuespedes ?? 2,
      cantidadHuespedesAdicionales: glamping.cantidadHuespedesAdicionales ?? 0,
      minimoNoches: glamping.minimoNoches ?? 1,
      aceptaMascotas: glamping.aceptaMascotas ?? false,
      checkInNoche: glamping.checkInNoche || '15:00',
      checkOutNoche: glamping.checkOutNoche || '12:00',
      precioMascotas: glamping.precioMascotas ?? 0,
      permitePasadia: glamping.permitePasadia ?? false,
      pasadiaHorarioInicio: glamping.pasadiaHorarioInicio || '08:00',
      pasadiaHorarioFin: glamping.pasadiaHorarioFin || '17:00',
      diasCancelacion: glamping.diasCancelacion ?? 15,
      noCancelaciones: glamping.diasCancelacion === 0,
      politicasCasa: glamping.politicasCasa || '',
      videoYoutube: glamping.videoYoutube || '',
      tarifasNoche: tn,
      tarifasPasadia: tp,
    })
  }, [glamping]) // eslint-disable-line

  // Subir fotos nuevas — retorna la lista final de URLs (existentes + recién subidas)
  const guardarImagenes = useCallback(async (): Promise<string[]> => {
    const saved = imagenes.filter((i): i is string => typeof i === 'string')
    const pendientes = imagenes.filter((i): i is File => i instanceof File)
    if (!pendientes.length) return saved
    setGuardandoFotos(true)
    const fd = new window.FormData()
    pendientes.forEach((img) => fd.append('imagenes', img))
    try {
      const { data } = await api.post(`/glampings/${id}/imagenes`, fd)
      const urls: string[] = Array.isArray(data)
        ? data.map((item: { url: string }) => item.url)
        : (data.imagenes ?? data.urls ?? [])
      const finalList = [...saved, ...urls]
      setImagenes(finalList)
      return finalList
    } catch { toast.error('Error al subir fotos'); return saved }
    finally { setGuardandoFotos(false) }
  }, [id, imagenes])

  // Guardar cambios
  const guardar = useMutation({
    mutationFn: async (values: FormData) => {
      // Subir fotos nuevas y obtener lista final de URLs
      const finalImagenes = await guardarImagenes()

      const raw: Record<string, unknown> = { ...values }
      raw.imagenes = finalImagenes
      if (values.noCancelaciones) raw.diasCancelacion = 0
      delete raw.noCancelaciones
      if (values.nombreGlamping) raw.nombreGlamping = toTitleCase(values.nombreGlamping)
      if (values.nombrePropiedad) raw.nombrePropiedad = toTitleCase(values.nombrePropiedad)
      raw.amenidades = amenidades
      raw.extras = Object.entries(extras).map(([key, { precio, descripcion, unidad }]) => {
        const cat = CATALOGO_EXTRAS.find((c) => c.key === key)
        return { key, nombre: cat?.nombre ?? key, descripcion, precio: Number(precio) || 0, unidad: unidad ?? cat?.unidad ?? 'por_grupo', disponible: true }
      })
      if (ubicacion.lat && ubicacion.lng) raw.ubicacion = { lat: Number(ubicacion.lat), lng: Number(ubicacion.lng) }
      if (tieneValores(values.tarifasNoche)) {
        raw.tarifasNoche = Object.fromEntries(Object.entries(values.tarifasNoche).map(([k, v]) => [k, Number(v) || 0]))
      } else { delete raw.tarifasNoche }
      if (tieneValores(values.tarifasPasadia)) {
        raw.tarifasPasadia = Object.fromEntries(Object.entries(values.tarifasPasadia).map(([k, v]) => [k, Number(v) || 0]))
      } else { delete raw.tarifasPasadia }
      const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined && v !== null))
      // Campos que el usuario puede borrar intencionalmente
      if (!values.videoYoutube?.trim()) payload.videoYoutube = null
      const { data } = await api.put(`/glampings/Datos/${id}`, payload)
      return data
    },
    onSuccess: () => {
      toast.success('Glamping actualizado')
      queryClient.invalidateQueries({ queryKey: ['glamping-edit', id] })
      queryClient.invalidateQueries({ queryKey: ['glamping', id] })
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  // Unidades queries & mutations
  const { data: unidades = [], refetch: refetchUnidades } = useQuery({
    queryKey: ['unidades', id],
    queryFn: async () => { const { data } = await api.get(`/glampings/${id}/unidades`); return data as UnidadItem[] },
    enabled: !!glamping,
  })

  const updateUnidad = useMutation({
    mutationFn: async ({ uid, payload }: { uid: string; payload: object }) => {
      const { data } = await api.put(`/glampings/${id}/unidades/${uid}`, payload)
      return data
    },
    onSuccess: () => { toast.success('Unidad actualizada'); setEditandoUnidad(null); refetchUnidades() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const addUnidad = useMutation({
    mutationFn: async (nombre: string) => {
      const { data } = await api.post(`/glampings/${id}/unidades`, { nombre })
      return data
    },
    onSuccess: () => { toast.success('Unidad agregada'); setAgregandoUnidad(false); setNuevaUnidadNombre(''); refetchUnidades() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteUnidad = useMutation({
    mutationFn: async (uid: string) => api.delete(`/glampings/${id}/unidades/${uid}`),
    onSuccess: () => { toast.success('Unidad eliminada'); refetchUnidades() },
    onError: (err) => toast.error(getErrorMessage(err)),
  })


  if (isLoading) return (
    <div className="max-w-3xl space-y-4">
      <Skeleton className="h-7 w-48" /><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" />
    </div>
  )

  if (!glamping) return (
    <div className="max-w-3xl">
      <p className="text-red-500 text-sm">Glamping no encontrado</p>
      <Link href="/anfitrion/glampings" className="text-sm text-brand hover:underline mt-2 inline-block">← Volver</Link>
    </div>
  )

  const sectionClass = 'bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5'
  const sectionTitle = 'font-semibold text-stone-800 text-base border-b border-stone-100 pb-3 mb-2'

  return (
    <div className="max-w-3xl space-y-6 pb-10">
    <form onSubmit={handleSubmit((v) => guardar.mutate(v))} className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/anfitrion/glampings" className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-1">
            <ArrowLeft size={14} /> Mis glampings
          </Link>
          <h1 className="text-xl font-bold text-stone-900">Editar glamping</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/anfitrion/glampings/${id}/calendario`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-brand-light text-sm hover:bg-emerald-100 transition-colors">
            <CalendarDays size={14} /> Calendario
          </Link>
          {glamping.habilitado && (
            <Link href={`/glamping/${id}`} target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 shrink-0">
              <Eye size={14} /> Ver publicación
            </Link>
          )}
        </div>
      </div>

      {/* ── 1. Información básica ─────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Información básica</h2>

        <Input label="Nombre del establecimiento (opcional)" placeholder="Finca La Esperanza" {...register('nombrePropiedad')} />
        <Input label="Nombre de la unidad *" placeholder="Domo Estrella" error={errors.nombreGlamping?.message}
          {...register('nombreGlamping', { required: 'Requerido' })} />

        {/* Tipo */}
        <div>
          <label className="text-sm font-medium text-stone-700 block mb-2">Tipo de glamping *</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tipoGlampingLabels).map(([key, label]) => {
              const selected = watch('tipoGlamping') === key
              return (
                <button key={key} type="button" onClick={() => setValue('tipoGlamping', key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${selected ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                  <TipoGlampingIcon tipo={key} size={18} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <Textarea label="Descripción *" rows={5} error={errors.descripcionGlamping?.message}
          {...register('descripcionGlamping', { required: 'Requerido' })} />

        <CiudadAutocomplete value={watch('ciudadDepartamento') || ''} onChange={(v) => setValue('ciudadDepartamento', v, { shouldDirty: true })} />
        <Input label="Dirección / referencia" placeholder="Km 3 vía El Peñol" {...register('direccion')} />
        <Input label="Link de video YouTube (opcional)" placeholder="https://youtube.com/watch?v=..." {...register('videoYoutube')} />
      </div>

      {/* ── 2. Precios y capacidad ────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Precios y capacidad</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Precio base por noche (COP) *" type="number" min={0}
            error={errors.precioNoche?.message} {...register('precioNoche', { required: 'Requerido', valueAsNumber: true, min: { value: 1, message: 'Debe ser > 0' } })} />
          <Input label="Precio persona adicional (COP)" type="number" min={0}
            disabled={huespedesAdicionales === 0} {...register('precioPersonaAdicional', { valueAsNumber: true })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Huéspedes base" type="number" min={1} {...register('cantidadHuespedes', { valueAsNumber: true })} />
          <Input label="Huéspedes adicionales" type="number" min={0} {...register('cantidadHuespedesAdicionales', { valueAsNumber: true })} />
          <Input label="Mínimo de noches" type="number" min={1} {...register('minimoNoches', { valueAsNumber: true })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Check-in (noche)" type="time" {...register('checkInNoche')} />
          <Input label="Check-out (noche)" type="time" {...register('checkOutNoche')} />
        </div>

        {/* Mascotas */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" {...register('aceptaMascotas')} className="w-4 h-4 accent-brand" />
          <span className="text-sm font-medium text-stone-700">Acepta mascotas</span>
        </label>
        {aceptaMascotas && (
          <Input label="Precio por mascota (0 = gratis)" type="number" min={0} {...register('precioMascotas', { valueAsNumber: true })} />
        )}

        {/* Pasadía */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox" {...register('permitePasadia')} className="w-4 h-4 accent-brand" />
          <span className="text-sm font-medium text-stone-700">Permite pasadía</span>
        </label>
        {permitePasadia && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Horario entrada pasadía" type="time" {...register('pasadiaHorarioInicio')} />
            <Input label="Horario salida pasadía" type="time" {...register('pasadiaHorarioFin')} />
          </div>
        )}

        {/* Tarifas por día — noche */}
        <div>
          <button type="button" onClick={() => setMostrarTarifasNoche((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900">
            {mostrarTarifasNoche ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Tarifas por día de semana (opcional)
          </button>
          {mostrarTarifasNoche && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {DIAS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
                  <input type="number" min={0} disabled={precioNocheBase === 0}
                    placeholder={String(precioNocheBase || 0)}
                    {...register(`tarifasNoche.${key as Dia}`, { valueAsNumber: true })}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand disabled:bg-stone-50 disabled:text-stone-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tarifas por día — pasadía */}
        {permitePasadia && (
          <div>
            <button type="button" onClick={() => setMostrarTarifasPasadia((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900">
              {mostrarTarifasPasadia ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Tarifas pasadía por día (opcional)
            </button>
            {mostrarTarifasPasadia && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                {DIAS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
                    <input type="number" min={0}
                      {...register(`tarifasPasadia.${key as Dia}`, { valueAsNumber: true })}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Fotos ──────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Fotos</h2>
        <FotosUpload imagenes={imagenes} onChange={setImagenes} />
        {imagenes.filter((i) => i instanceof File).length > 0 && (
          <p className="text-xs text-amber-600">
            Tienes {imagenes.filter((i) => i instanceof File).length} foto(s) sin guardar — se subirán al guardar cambios.
          </p>
        )}
        {imagenes.filter((i) => typeof i === 'string').length < imagenesOriginalesCount.current && (
          <p className="text-xs text-red-500">
            Eliminaste {imagenesOriginalesCount.current - imagenes.filter((i) => typeof i === 'string').length} foto(s) — haz clic en guardar cambios para confirmar.
          </p>
        )}
      </div>

      {/* ── 4. Ubicación ─────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Ubicación</h2>
        <p className="text-sm text-stone-400">Arrastra el marcador para ajustar la posición exacta.</p>
        <div className="h-72 rounded-xl overflow-hidden border border-stone-200">
          <MapaPicker
            lat={ubicacion.lat ?? ''}
            lng={ubicacion.lng ?? ''}
            onChange={(lat, lng) => setUbicacion({ lat, lng })}
          />
        </div>
        {ubicacion.lat && <p className="text-xs text-stone-400">Lat: {ubicacion.lat} · Lng: {ubicacion.lng}</p>}
      </div>

      {/* ── 5. Amenidades ────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Amenidades</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENIDADES_DISPONIBLES.map((a) => {
            const active = amenidades.includes(a.id)
            return (
              <label key={a.id} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${active ? 'border-emerald-400 bg-emerald-50 text-brand-light' : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                <input type="checkbox" checked={active} onChange={() => setAmenidades((prev) => active ? prev.filter((x) => x !== a.id) : [...prev, a.id])} className="w-3.5 h-3.5 accent-brand" />
                {a.label}
              </label>
            )
          })}
        </div>
      </div>

      {/* ── 6. Extras ────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Servicios extras</h2>
        <div className="space-y-3">
          {CATALOGO_EXTRAS.map((cat) => {
            const active = !!extras[cat.key]
            const val = extras[cat.key]
            return (
              <div key={cat.key} className={`rounded-xl border transition-all ${active ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200'}`}>
                <label className="flex items-center gap-3 p-3 cursor-pointer">
                  <input type="checkbox" checked={active} onChange={() => {
                    setExtras((prev) => {
                      if (active) { const n = { ...prev }; delete n[cat.key]; return n }
                      return { ...prev, [cat.key]: { precio: 0, descripcion: '', unidad: cat.unidad } }
                    })
                  }} className="w-4 h-4 accent-brand shrink-0" />
                  <span className="text-sm font-medium text-stone-700 flex-1">{cat.nombre}</span>
                </label>
                {active && (
                  <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-stone-500 block mb-1">Precio (COP)</label>
                      <input type="number" min={0} value={val.precio}
                        onChange={(e) => setExtras((p) => ({ ...p, [cat.key]: { ...p[cat.key], precio: Number(e.target.value) } }))}
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-500 block mb-1">Unidad</label>
                      <select value={val.unidad}
                        onChange={(e) => setExtras((p) => ({ ...p, [cat.key]: { ...p[cat.key], unidad: e.target.value } }))}
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                        {Object.entries(UNIDAD_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-500 block mb-1">Descripción</label>
                      <input type="text" value={val.descripcion} placeholder="Opcional"
                        onChange={(e) => setExtras((p) => ({ ...p, [cat.key]: { ...p[cat.key], descripcion: e.target.value } }))}
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 7. Políticas ─────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className={sectionTitle}>Políticas</h2>
        <Textarea label="Políticas de la casa" rows={4} placeholder="Reglas, normas, restricciones..." {...register('politicasCasa')} />
        <div>
          <label className="flex items-center gap-3 cursor-pointer select-none mb-3">
            <input type="checkbox" {...register('noCancelaciones')} className="w-4 h-4 accent-brand" />
            <span className="text-sm font-medium text-stone-700">No admite cancelaciones</span>
          </label>
          {!noCancelaciones && (
            <Input label="Días de anticipación para cancelar gratis" type="number" min={1}
              {...register('diasCancelacion', { valueAsNumber: true })} />
          )}
        </div>
      </div>

      {/* Botón flotante sticky — se queda en el fondo del form, nunca sale del padre */}
      <div className="sticky bottom-4 flex justify-end pointer-events-none">
        <Button type="submit" size="lg" variant="brand" loading={guardar.isPending || guardandoFotos}
          className="pointer-events-auto shadow-lg">
          <Save size={16} /> Guardar cambios
        </Button>
      </div>
    </form>

    {/* ── 8. Unidades e iCal ───────────────────────────────────────── */}
    <div className={sectionClass}>
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div>
          <h2 className="font-semibold text-stone-800 text-base">Unidades y sincronización iCal</h2>
          <p className="text-xs text-stone-400 mt-0.5">Cúpulas, domos, cabañas — cada una puede sincronizar con Airbnb o Booking</p>
        </div>
        <button type="button" onClick={() => setAgregandoUnidad(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white text-xs font-medium transition-colors">
          <Plus size={13} /> Agregar unidad
        </button>
      </div>

      {/* URL de exportación para pegar en Airbnb/Booking */}
      {(() => {
        const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.glamperos.com'}/ical/exportar/${id}`
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
              <Link2 size={12} /> Tu URL de Glamperos → para pegar en Airbnb / Booking
            </p>
            <p className="text-xs text-blue-600">
              Copia esta URL y pégala en la sección "Sincronizar calendario" de Airbnb o Booking para que vean tus reservas de Glamperos.
            </p>
            <div className="flex items-center gap-2">
              <input readOnly value={exportUrl}
                className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs text-stone-700 focus:outline-none select-all" />
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(exportUrl); toast.success('URL copiada') }}
                className="shrink-0 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors">
                Copiar
              </button>
            </div>
          </div>
        )
      })()}

      <div className="space-y-3">
        {unidades.map((u) => (
          <div key={u._id} className="rounded-xl border border-stone-200 overflow-hidden">
            {editandoUnidad === u._id ? (
              <div className="p-4 space-y-3 bg-stone-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 block mb-1">Nombre</label>
                    <input value={unidadForm.nombre} onChange={(e) => setUnidadForm((p) => ({ ...p, nombre: e.target.value }))}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 block mb-1 flex items-center gap-1"><Link2 size={11} /> iCal Airbnb</label>
                    <input value={unidadForm.urlIcal} onChange={(e) => setUnidadForm((p) => ({ ...p, urlIcal: e.target.value }))}
                      placeholder="https://www.airbnb.com/calendar/ical/..."
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 block mb-1 flex items-center gap-1"><Link2 size={11} /> iCal Booking</label>
                    <input value={unidadForm.urlIcalBooking} onChange={(e) => setUnidadForm((p) => ({ ...p, urlIcalBooking: e.target.value }))}
                      placeholder="https://ical.booking.com/..."
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditandoUnidad(null)}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 text-sm text-stone-600 hover:bg-stone-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => updateUnidad.mutate({ uid: u._id, payload: { nombre: unidadForm.nombre, urlIcal: unidadForm.urlIcal || null, urlIcalBooking: unidadForm.urlIcalBooking || null } })}
                    disabled={updateUnidad.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white text-sm font-medium transition-colors disabled:opacity-50">
                    <Check size={14} /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-brand-light font-bold text-sm">
                  {u.numero}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 text-sm">{u.nombre}</p>
                  <div className="flex gap-3 mt-0.5">
                    {u.urlIcal ? (
                      <span className="text-xs text-brand flex items-center gap-1"><Link2 size={10} /> Airbnb ✓</span>
                    ) : (
                      <span className="text-xs text-stone-400">Sin iCal Airbnb</span>
                    )}
                    {u.urlIcalBooking ? (
                      <span className="text-xs text-brand flex items-center gap-1"><Link2 size={10} /> Booking ✓</span>
                    ) : (
                      <span className="text-xs text-stone-400">Sin iCal Booking</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => { setEditandoUnidad(u._id); setUnidadForm({ nombre: u.nombre, urlIcal: u.urlIcal ?? '', urlIcalBooking: u.urlIcalBooking ?? '' }) }}
                    className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors" title="Editar">
                    <Pencil size={14} />
                  </button>
                  {unidades.length > 1 && (
                    <button type="button" onClick={() => { if (confirm(`¿Eliminar ${u.nombre}?`)) deleteUnidad.mutate(u._id) }}
                      className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {agregandoUnidad && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <input value={nuevaUnidadNombre} onChange={(e) => setNuevaUnidadNombre(e.target.value)}
              placeholder="Ej: Cúpula 2, Domo Norte..."
              className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            <button type="button" onClick={() => addUnidad.mutate(nuevaUnidadNombre)} disabled={!nuevaUnidadNombre.trim() || addUnidad.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand hover:bg-brand-light text-white text-sm font-medium disabled:opacity-50 transition-colors">
              <Check size={14} /> Agregar
            </button>
            <button type="button" onClick={() => { setAgregandoUnidad(false); setNuevaUnidadNombre('') }}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>

    </div>
  )
}
