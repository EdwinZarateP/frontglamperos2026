'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Phone, Cloud, ChevronDown, ChevronUp } from 'lucide-react'
import { tipoGlampingLabels, toTitleCase } from '@/lib/utils'
import { useCatalogoExtras, UNIDAD_LABELS, type CatalogoExtra } from '@/lib/catalogoExtras'
import { TipoGlampingIcon } from '@/components/ui/TipoGlampingIcon'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useMe } from '@/hooks/useAuth'
import { useTiposGlamping } from '@/hooks/useGlampings'
import { Input, Textarea } from '@/components/ui/Input'
import { CiudadAutocomplete } from '@/components/ui/CiudadAutocomplete'
import dynamic from 'next/dynamic'
const MapaPicker = dynamic(() => import('@/components/ui/MapaPicker').then(m => m.MapaPicker), { ssr: false })
import { FotosUpload, type ImagenItem } from '@/components/ui/FotosUpload'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Upload, FileText, X } from 'lucide-react'

const AMENIDADES_DISPONIBLES: { id: string; label: string }[] = [
  { id: 'wifi',                  label: 'Wifi' },
  { id: 'parlante',              label: 'Parlante' },
  { id: 'mascotas',              label: 'Mascotas' },
  { id: 'zona-de-trabajo',       label: 'Zona de trabajo' },
  { id: 'coctel-bienvenida',     label: 'Coctel bienvenida' },
  { id: 'jacuzzi',               label: 'Jacuzzi' },
  { id: 'sauna',                 label: 'Sauna' },
  { id: 'tina',                  label: 'Tina' },
  { id: 'piscina',               label: 'Piscina' },
  { id: 'malla-catamaran',       label: 'Malla catamarán' },
  { id: 'mesedora',              label: 'Mesedora' },
  { id: 'mesa-y-sillas',         label: 'Mesa y sillas' },
  { id: 'zona-hamaca',           label: 'Zona hamaca' },
  { id: 'zona-masajes',          label: 'Zona masajes' },
  { id: 'parrilla',              label: 'Parrilla' },
  { id: 'cocina',                label: 'Cocina' },
  { id: 'zona-fogata',           label: 'Zona fogata' },
  { id: 'chimenea',              label: 'Chimenea' },
  { id: 'servicio-restaurante',  label: 'Servicio restaurante' },
  { id: 'incluye-desayuno',      label: 'Incluye desayuno' },
  { id: 'incluye-almuerzo',      label: 'Incluye almuerzo' },
  { id: 'incluye-cena',          label: 'Incluye cena' },
  { id: 'servicio-cuatrimoto',   label: 'Servicio cuatrimoto' },
  { id: 'mini-bar',              label: 'Mini bar' },
  { id: 'tv',                    label: 'TV' },
  { id: 'proyector',             label: 'Proyector' },
  { id: 'telescopio',            label: 'Telescopio' },
  { id: 'toallas',               label: 'Toallas' },
  { id: 'jabon',                 label: 'Jabón' },
  { id: 'bano-privado',          label: 'Baño privado' },
  { id: 'bano-compartido',       label: 'Baño compartido' },
  { id: 'juegos-de-mesa',        label: 'Juegos de mesa' },
  { id: 'lavadora',              label: 'Lavadora' },
  { id: 'clima-calido',          label: 'Clima cálido' },
  { id: 'vista-al-lago',         label: 'Vista al lago' },
  { id: 'ventilador',            label: 'Ventilador' },
  { id: 'aire-acondicionado',    label: 'Aire acondicionado' },
  { id: 'clima-frio',            label: 'Clima frío' },
  { id: 'calefaccion',           label: 'Calefacción' },
  { id: 'ducha',                 label: 'Ducha' },
  { id: 'detector-de-humo',      label: 'Detector de humo' },
  { id: 'extintor',              label: 'Extintor' },
  { id: 'botiquin',              label: 'Botiquín' },
  { id: 'playa',                 label: 'Playa' },
  { id: 'naturaleza',            label: 'Naturaleza' },
  { id: 'rio',                   label: 'Río' },
  { id: 'cascada',               label: 'Cascada' },
  { id: 'en-la-montana',         label: 'En la montaña' },
  { id: 'desierto',              label: 'Desierto' },
  { id: 'caminata',              label: 'Caminata' },
  { id: 'parqueadero',           label: 'Parqueadero' },
]

const DIAS = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
] as const

type Dia = typeof DIAS[number]['key']

interface TarifaDiariaForm {
  lunes: number
  martes: number
  miercoles: number
  jueves: number
  viernes: number
  sabado: number
  domingo: number
}

interface FormData {
  nombrePropiedad: string
  nombreGlamping: string
  tipoGlamping: string
  descripcionGlamping: string
  ciudadDepartamento: string
  direccion: string
  precioNoche: number
  precioPersonaAdicional: number
  cantidadHuespedes: number
  cantidadHuespedesAdicionales: number
  minimoNoches: number
  aceptaMascotas: boolean
  checkInNoche: string
  checkOutNoche: string
  precioMascotas: number
  permitePasadia: boolean
  pasadiaHorarioInicio: string
  pasadiaHorarioFin: string
  diasCancelacion: number
  noCancelaciones: boolean
  politicasCasa: string
  videoYoutube: string
  tarifasNoche: TarifaDiariaForm
  tarifasPasadia: TarifaDiariaForm
}

const TARIFA_VACIA: TarifaDiariaForm = { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0, domingo: 0 }

const DEFAULT_VALUES: Partial<FormData> = {
  minimoNoches: 1,
  cantidadHuespedes: 2,
  cantidadHuespedesAdicionales: 0,
  checkInNoche: '15:00',
  checkOutNoche: '12:00',
  aceptaMascotas: false,
  permitePasadia: false,
  pasadiaHorarioInicio: '08:00',
  pasadiaHorarioFin: '17:00',
  diasCancelacion: 15,
  noCancelaciones: false,
  tarifasNoche: { ...TARIFA_VACIA },
  tarifasPasadia: { ...TARIFA_VACIA },
}

function buildTarifaFromApi(t: Record<string, number> | null | undefined): TarifaDiariaForm {
  if (!t) return { ...TARIFA_VACIA }
  return {
    lunes:     t.lunes     ?? 0,
    martes:    t.martes    ?? 0,
    miercoles: t.miercoles ?? 0,
    jueves:    t.jueves    ?? 0,
    viernes:   t.viernes   ?? 0,
    sabado:    t.sabado    ?? 0,
    domingo:   t.domingo   ?? 0,
  }
}

function tarifaTieneValores(t: TarifaDiariaForm): boolean {
  return Object.values(t).some((v) => Number(v) > 0)
}

export default function NuevoGlampingPage() {
  const router = useRouter()
  const { updateUser } = useAuthStore()
  const { data: perfil, isLoading: loadingPerfil } = useMe()
  const { data: tipos = [] } = useTiposGlamping()

  const [step, setStep] = useState(1)
  const [maxStep, setMaxStep] = useState(1)
  const [imagenes, setImagenes] = useState<ImagenItem[]>([])
  const [amenidades, setAmenidades] = useState<string[]>([])
  const [extras, setExtras] = useState<Record<string, { precio: number; descripcion: string; unidad: string }>>({})
  // key → { precio, descripcion, unidad } — solo los activados por el anfitrión
  const [ubicacion, setUbicacion] = useState({ lat: '', lng: '' })
  const [draftId, setDraftId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null)
  const [mostrarTarifasNoche, setMostrarTarifasNoche] = useState(false)
  const [mostrarTarifasPasadia, setMostrarTarifasPasadia] = useState(false)
  const [rntFile, setRntFile] = useState<File | null>(null)
  const [rntUrl, setRntUrl] = useState<string>('')
  const dirtyRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Admin: asignar propietario
  const isAdmin = perfil?.rol === 'admin'
  const [propietarioId, setPropietarioId] = useState('')
  const [propietarioBusqueda, setPropietarioBusqueda] = useState('')
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState<{ id: string; nombre: string; email: string } | null>(null)

  const { data: catalogoExtras = [] } = useCatalogoExtras()

  const { data: todosUsuarios = [] } = useQuery<{ id?: string; _id?: string; nombre: string; email: string; rol: string }[]>({
    queryKey: ['admin-usuarios'],
    queryFn: async () => (await api.get('/usuarios/todos/lista')).data,
    enabled: isAdmin,
  })

  const usuariosSugeridos = propietarioBusqueda.trim() && !propietarioSeleccionado
    ? todosUsuarios.filter((u) =>
        u.nombre?.toLowerCase().includes(propietarioBusqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(propietarioBusqueda.toLowerCase())
      ).slice(0, 6)
    : []

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: DEFAULT_VALUES,
  })
  const permitePasadia = watch('permitePasadia')
  const precioNocheBase = Number(watch('precioNoche')) || 0

  // Auto-expandir tarifas pasadía cuando se activa la opción
  useEffect(() => {
    if (permitePasadia) setMostrarTarifasPasadia(true)
  }, [permitePasadia])

  // ── Cargar borrador existente ─────────────────────────────────────────────
  const { data: borradorExistente, isLoading: loadingBorrador } = useQuery({
    queryKey: ['mi-borrador'],
    queryFn: async () => {
      const { data } = await api.get('/glampings/mi-borrador')
      return data
    },
    retry: false,
    staleTime: 0,
  })

  useEffect(() => {
    if (loadingBorrador) return
    if (!borradorExistente) {
      // No hay borrador (fue publicado/aprobado) — resetear todo a defaults
      reset(DEFAULT_VALUES)
      setAmenidades([])
      setExtras({})
      setUbicacion({ lat: '', lng: '' })
      setImagenes([])
      setDraftId(null)
      setMaxStep(1)
      setStep(1)
      return
    }
    setDraftId(borradorExistente._id)
    setAmenidades(borradorExistente.amenidades || [])
    if (borradorExistente.extras?.length) {
      const map: Record<string, { precio: number; descripcion: string; unidad: string }> = {}
      for (const e of borradorExistente.extras) {
        map[e.key] = { precio: e.precio ?? 0, descripcion: e.descripcion ?? '', unidad: e.unidad === 'por_grupo' ? 'por_pareja' : (e.unidad ?? 'por_pareja') }
      }
      setExtras(map)
    }
    const ub = borradorExistente.ubicacion || {}
    setUbicacion({ lat: String(ub.lat || ''), lng: String(ub.lng || '') })
    if (borradorExistente.imagenes?.length) {
      setImagenes(borradorExistente.imagenes as string[])
      setMaxStep((m) => Math.max(m, borradorExistente.imagenes.length >= 5 ? 3 : 2))
    } else {
      setMaxStep((m) => Math.max(m, 2))
    }
    const tn = buildTarifaFromApi(borradorExistente.tarifasNoche)
    const tp = buildTarifaFromApi(borradorExistente.tarifasPasadia)
    if (tarifaTieneValores(tn)) setMostrarTarifasNoche(true)
    if (tarifaTieneValores(tp)) setMostrarTarifasPasadia(true)
    reset({
      nombrePropiedad:              borradorExistente.nombrePropiedad || '',
      nombreGlamping:               borradorExistente.nombreGlamping || '',
      tipoGlamping:                 borradorExistente.tipoGlamping || '',
      descripcionGlamping:          borradorExistente.descripcionGlamping || '',
      ciudadDepartamento:           borradorExistente.ciudadDepartamento || '',
      direccion:                    borradorExistente.direccion || '',
      precioNoche:                  borradorExistente.precioNoche || 0,
      precioPersonaAdicional:       borradorExistente.precioPersonaAdicional || 0,
      cantidadHuespedes:            borradorExistente.cantidadHuespedes ?? DEFAULT_VALUES.cantidadHuespedes,
      cantidadHuespedesAdicionales: borradorExistente.cantidadHuespedesAdicionales ?? DEFAULT_VALUES.cantidadHuespedesAdicionales,
      minimoNoches:                 borradorExistente.minimoNoches ?? DEFAULT_VALUES.minimoNoches,
      aceptaMascotas:               borradorExistente.aceptaMascotas ?? false,
      checkInNoche:                 borradorExistente.checkInNoche || DEFAULT_VALUES.checkInNoche,
      checkOutNoche:                borradorExistente.checkOutNoche || DEFAULT_VALUES.checkOutNoche,
      precioMascotas:               borradorExistente.precioMascotas ?? 0,
      permitePasadia:               borradorExistente.permitePasadia ?? false,
      pasadiaHorarioInicio:         borradorExistente.pasadiaHorarioInicio || DEFAULT_VALUES.pasadiaHorarioInicio,
      pasadiaHorarioFin:            borradorExistente.pasadiaHorarioFin || DEFAULT_VALUES.pasadiaHorarioFin,
      diasCancelacion:              borradorExistente.diasCancelacion ?? DEFAULT_VALUES.diasCancelacion,
      noCancelaciones:              borradorExistente.diasCancelacion === 0,
      politicasCasa:                borradorExistente.politicasCasa || '',
      videoYoutube:                 borradorExistente.videoYoutube || '',
      tarifasNoche:                 tn,
      tarifasPasadia:               tp,
    })
    if (borradorExistente.rntUrl) setRntUrl(borradorExistente.rntUrl)
  }, [borradorExistente, loadingBorrador]) // eslint-disable-line

  // ── Auto-guardado en API (cada 30 segundos si hay cambios) ───────────────
  const formValues = watch()

  const guardarEnApi = useCallback(async (values: FormData, idOverride?: string) => {
    const targetId = idOverride ?? draftId
    if (!targetId) return
    setGuardando(true)
    try {
      const raw: Record<string, unknown> = { ...values }
      if (values.noCancelaciones) raw.diasCancelacion = 0
      delete raw.noCancelaciones
      if (values.nombreGlamping)  raw.nombreGlamping  = toTitleCase(values.nombreGlamping)
      if (values.nombrePropiedad) raw.nombrePropiedad = toTitleCase(values.nombrePropiedad)
      if (amenidades.length)      raw.amenidades      = amenidades
      // Serializar extras activos al formato ServicioExtra del backend
      const extrasPayload = Object.entries(extras).map(([key, { precio, descripcion, unidad }]) => {
        const cat = catalogoExtras.find((c) => c.key === key)
        return { key, nombre: cat?.nombre ?? key, descripcion, precio: Number(precio) || 0, unidad: unidad ?? cat?.unidad ?? 'por_grupo', disponible: true }
      })
      raw.extras = extrasPayload
      if (ubicacion.lat && ubicacion.lng) {
        raw.ubicacion = { lat: Number(ubicacion.lat), lng: Number(ubicacion.lng) }
      }
      // Solo incluir tarifas si tienen al menos un valor > 0
      if (tarifaTieneValores(values.tarifasNoche)) {
        raw.tarifasNoche = Object.fromEntries(
          Object.entries(values.tarifasNoche).map(([k, v]) => [k, Number(v) || 0])
        )
      } else {
        delete raw.tarifasNoche
      }
      if (tarifaTieneValores(values.tarifasPasadia)) {
        raw.tarifasPasadia = Object.fromEntries(
          Object.entries(values.tarifasPasadia).map(([k, v]) => [k, Number(v) || 0])
        )
      } else {
        delete raw.tarifasPasadia
      }
      // Eliminar strings vacíos para evitar 422 en campos enum/number del backend
      const payload = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      await api.put(`/glampings/Datos/${targetId}`, payload)
      setUltimoGuardado(new Date())
      dirtyRef.current = false
    } catch {
      // silencioso — no interrumpir al usuario
    } finally {
      setGuardando(false)
    }
  }, [draftId, amenidades, ubicacion])

  // Subir imágenes pendientes (File[]) y reemplazarlas por sus URLs en el estado
  const guardarImagenes = useCallback(async (targetId: string) => {
    const pendientes = imagenes.filter((i): i is File => i instanceof File)
    if (!pendientes.length) return
    const fd = new window.FormData()
    pendientes.forEach((img) => fd.append('imagenes', img))
    try {
      const { data } = await api.post(`/glampings/${targetId}/imagenes`, fd)
      const nuevasUrls: string[] = data.map((d: { url: string }) => d.url)
      // Reemplazar cada File por su URL correspondiente en el orden actual
      let urlIdx = 0
      setImagenes((prev) =>
        prev.map((item) => {
          if (item instanceof File) return nuevasUrls[urlIdx++] ?? item
          return item
        })
      )
    } catch {
      // silencioso — las imágenes se intentarán subir al publicar
    }
  }, [imagenes])

  // Marcar como "hay cambios" cuando el usuario edita
  useEffect(() => {
    dirtyRef.current = true
  }, [formValues, amenidades, ubicacion, extras])

  // Guardar cada 30 segundos solo si hay cambios pendientes
  useEffect(() => {
    if (!draftId) return
    intervalRef.current = setInterval(() => {
      if (dirtyRef.current) guardarEnApi(formValues)
    }, 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [draftId, guardarEnApi]) // eslint-disable-line

  // ── Validación por paso ───────────────────────────────────────────────────
  const validateStep1 = (values: FormData): string | null => {
    if (!values.tipoGlamping)              return 'Selecciona el tipo de glamping'
    if (!values.nombreGlamping?.trim())    return 'Ingresa el nombre de la unidad'
    if (!values.descripcionGlamping?.trim()) return 'Agrega una descripción'
    if (!values.ciudadDepartamento?.trim()) return 'Ingresa la ciudad / departamento'
    if (!values.precioNoche || Number(values.precioNoche) < 1) return 'El precio base por noche debe ser mayor a 0'
    return null
  }

  // ── Crear borrador al avanzar del step 1 ─────────────────────────────────
  const avanzarStep1 = async () => {
    const values = formValues
    const error = validateStep1(values)
    if (error) { toast.error(error); return }

    if (!draftId) {
      try {
        const fd = new window.FormData()
        fd.append('nombreGlamping', toTitleCase(values.nombreGlamping))
        fd.append('tipoGlamping', values.tipoGlamping)
        const { data } = await api.post('/glampings/borrador', fd)
        setDraftId(data._id)
        // Si admin seleccionó otro propietario, transferir propiedad ahora
        if (isAdmin && propietarioId) {
          await api.put(`/glampings/${data._id}/propietario`, null, {
            params: { nuevo_propietario_id: propietarioId },
          })
        }
        toast.success('Borrador creado — tu progreso se guarda automáticamente')
        guardarEnApi(values, data._id)
      } catch (err) {
        toast.error(getErrorMessage(err))
        return
      }
    } else {
      await guardarEnApi(values)
    }
    setStep(2)
    setMaxStep((m) => Math.max(m, 2))
  }

  const avanzarStep2 = async () => {
    if (imagenes.length < 5) {
      toast.error('Sube al menos 5 fotos para continuar')
      return
    }
    await guardarEnApi(formValues)
    if (draftId) await guardarImagenes(draftId)
    setStep(3)
    setMaxStep((m) => Math.max(m, 3))
  }

  // ── Publicar ──────────────────────────────────────────────────────────────
  const publicar = useMutation({
    mutationFn: async (data: FormData) => {
      if (!draftId) throw new Error('No hay borrador creado')
      await guardarEnApi(data)
      await guardarImagenes(draftId)

      if (rntFile) {
        const fd = new window.FormData()
        fd.append('rnt', rntFile)
        await api.post(`/glampings/${draftId}/rnt`, fd)
      }

      const res = await api.post(`/glampings/${draftId}/publicar`)
      return res.data
    },
    onSuccess: () => {
      if (perfil?.rol !== 'admin') updateUser({ rol: 'anfitrion' })
      toast.success('¡Solicitud enviada! El equipo de Glamperos revisará tu glamping pronto.')
      router.push('/anfitrion/glampings')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const toggleAmenidad = (a: string) => {
    setAmenidades((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
  }

  const STEPS = ['Información básica', 'Ubicación y fotos', 'Amenidades y políticas']

  if (loadingPerfil || loadingBorrador) return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Stepper */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-4 w-24 hidden sm:block" />
            {i < 3 && <Skeleton className="w-8 h-px" />}
          </div>
        ))}
      </div>
      {/* Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        {/* Tipo chips */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-10" />)}
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>
      {/* Nav */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  )

  if (!perfil?.telefono) return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Phone size={28} className="text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-2">Agrega tu teléfono primero</h2>
      <p className="text-stone-500 text-sm mb-6">
        Para publicar un glamping necesitamos tu número de teléfono.
      </p>
      <Link href="/perfil"><Button fullWidth>Ir a mi perfil y agregar teléfono</Button></Link>
    </div>
  )

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Publicar mi glamping</h1>
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
          {guardando
            ? <><Cloud size={13} className="animate-pulse" /> Guardando...</>
            : ultimoGuardado
              ? <><Cloud size={13} className="text-brand" /> Guardado</>
              : draftId
                ? <><Cloud size={13} className="text-stone-300" /> Sin guardar</>
                : <span className="text-stone-300">Sin borrador</span>
          }
        </div>
      </div>
      <p className="text-stone-400 text-sm mb-2">Completa la información para publicar tu propiedad</p>

      {borradorExistente && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-800">
          ✅ <strong>Continuando tu borrador.</strong> Tu progreso se guardó automáticamente.
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center mb-6 sm:mb-8">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const unlocked = stepNum <= maxStep
          const active = stepNum === step

          const handleStepClick = async () => {
            if (!unlocked || active) return
            if (stepNum < step) { setStep(stepNum); return }
            // Avanzar: ejecutar la misma lógica que "Siguiente"
            if (stepNum === 2) await avanzarStep1()
            if (stepNum === 3) await avanzarStep2()
          }

          return (
            <div key={i} className="flex items-center min-w-0">
              <button
                type="button"
                disabled={!unlocked || active}
                onClick={handleStepClick}
                className={`flex items-center gap-1.5 sm:gap-2 shrink-0 rounded-lg px-1 py-0.5 transition-colors ${
                  unlocked && !active ? 'cursor-pointer hover:bg-stone-100' : 'cursor-default'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  active ? 'bg-brand text-white' :
                  unlocked ? 'bg-emerald-100 text-brand-light hover:bg-emerald-200' :
                  'bg-stone-200 text-stone-400'
                }`}>
                  {stepNum}
                </div>
                {active ? (
                  <span className="text-sm font-medium text-stone-800 truncate max-w-[130px] sm:max-w-none">{label}</span>
                ) : (
                  <span className={`text-sm hidden sm:block ${unlocked ? 'text-stone-600' : 'text-stone-400'}`}>{label}</span>
                )}
              </button>
              {i < STEPS.length - 1 && <div className="w-6 sm:w-8 h-px bg-stone-200 mx-2 shrink-0" />}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit((d) => publicar.mutate(d))}>
        {/* ── Step 1 ─────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-5">

            {/* Selector de propietario (solo admin) */}
            {isAdmin && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Asignar a anfitrión</p>
                <p className="text-xs text-amber-600">Si no seleccionas a nadie, el glamping queda asignado a tu cuenta.</p>
                {propietarioSeleccionado ? (
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-amber-200 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{propietarioSeleccionado.nombre}</p>
                      <p className="text-xs text-stone-400 truncate">{propietarioSeleccionado.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPropietarioSeleccionado(null); setPropietarioId(''); setPropietarioBusqueda('') }}
                      className="shrink-0 text-xs text-stone-400 hover:text-red-500 transition-colors px-2"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={propietarioBusqueda}
                      onChange={(e) => setPropietarioBusqueda(e.target.value)}
                      className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    {usuariosSugeridos.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
                        {usuariosSugeridos.map((u) => {
                          const uid = u.id ?? u._id ?? ''
                          return (
                            <li key={uid}>
                              <button
                                type="button"
                                onClick={() => {
                                  setPropietarioSeleccionado({ id: uid, nombre: u.nombre, email: u.email })
                                  setPropietarioId(uid)
                                  setPropietarioBusqueda('')
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-stone-50 transition-colors"
                              >
                                <p className="text-sm font-medium text-stone-800">{u.nombre}</p>
                                <p className="text-xs text-stone-400">{u.email}</p>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <Input
              label="Nombre del establecimiento"
              placeholder="Ej: El Guadual, Finca La Esperanza"
              {...register('nombrePropiedad')}
            />
            <Input
              label="Nombre de la unidad *"
              placeholder="Ej: Domo Cielo, Cabaña del Bosque"
              error={errors.nombreGlamping?.message}
              {...register('nombreGlamping', { required: 'Requerido' })}
            />

            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-2">Tipo de glamping *</label>
              <div className="flex flex-wrap gap-2">
                {tipos.map((tipo) => {
                  const selected = watch('tipoGlamping') === tipo
                  return (
                    <label
                      key={tipo}
                      className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${
                        selected ? 'bg-brand text-white border-brand' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      <input type="radio" {...register('tipoGlamping')} value={tipo} className="sr-only" />
                      <TipoGlampingIcon tipo={tipo} size={18} />
                      {tipoGlampingLabels[tipo] ?? tipo}
                    </label>
                  )
                })}
              </div>
            </div>

            <Textarea
              label="Descripción *"
              placeholder="Describe la experiencia única que ofrece tu glamping..."
              {...register('descripcionGlamping')}
            />

            {/* Datos básicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CiudadAutocomplete
                value={watch('ciudadDepartamento') || ''}
                onChange={(val) => setValue('ciudadDepartamento', val, { shouldDirty: true })}
              />
              <Input label="Precio base por noche (COP) *" type="number" placeholder="300000" {...register('precioNoche')} />
              <Input label="Huéspedes incluidos *" type="number" min={1} max={50} {...register('cantidadHuespedes')} />
              <Input label="Huéspedes adicionales permitidos" type="number" min={0} max={20} {...register('cantidadHuespedesAdicionales')} />
              <div className={Number(watch('cantidadHuespedesAdicionales')) === 0 ? 'opacity-40' : ''}>
                <Input
                  label="Tarifa por huésped adicional (COP)"
                  type="number"
                  min={0}
                  placeholder="Ingresa huéspedes adicionales primero"
                  disabled={Number(watch('cantidadHuespedesAdicionales')) === 0}
                  {...register('precioPersonaAdicional')}
                />
              </div>
              <Input label="Mínimo de noches" type="number" min={1} {...register('minimoNoches')} />
              <Input label="Check-in" type="time" {...register('checkInNoche')} />
              <Input label="Check-out" type="time" {...register('checkOutNoche')} />
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('aceptaMascotas')} className="accent-brand" />
                <span className="text-sm text-stone-700">Acepta mascotas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('permitePasadia')} className="accent-brand" />
                <span className="text-sm text-stone-700">Permite pasadía</span>
              </label>
            </div>

            {watch('aceptaMascotas') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3 border-l-2 border-emerald-200">
                <div>
                  <Input
                    label="Tarifa por mascota (COP)"
                    type="number"
                    min={0}
                    placeholder="0 si es sin costo adicional"
                    {...register('precioMascotas')}
                  />
                  <p className="text-xs text-stone-400 mt-1">Escribe 0 si las mascotas no tienen costo adicional</p>
                </div>
              </div>
            )}

            {permitePasadia && (
              <div className="grid grid-cols-2 gap-4 pl-3 border-l-2 border-emerald-200">
                <Input label="Pasadía — hora de entrada" type="time" {...register('pasadiaHorarioInicio')} />
                <Input label="Pasadía — hora de salida" type="time" {...register('pasadiaHorarioFin')} />
              </div>
            )}

            {/* ── Tarifas por día (noches) ─────────────────────────────── */}
            <div className={`border rounded-xl overflow-hidden transition-colors ${precioNocheBase > 0 ? 'border-stone-200' : 'border-stone-100 opacity-50'}`}>
              <button
                type="button"
                disabled={precioNocheBase === 0}
                onClick={() => setMostrarTarifasNoche((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 disabled:hover:bg-stone-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-stone-700"
              >
                <span>Precios por día (noches)</span>
                <span className="flex items-center gap-1.5 text-stone-400 text-xs font-normal shrink-0 ml-2">
                  <span className="hidden sm:inline">
                    {precioNocheBase === 0 ? 'Ingresa precio base primero' : mostrarTarifasNoche ? 'Ocultar' : 'Opcional'}
                  </span>
                  {mostrarTarifasNoche ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {mostrarTarifasNoche && precioNocheBase > 0 && (
                <div className="p-4">
                  <p className="text-xs text-stone-400 mb-3">
                    Deja en 0 los días que quieras usar el precio base (${precioNocheBase.toLocaleString('es-CO')})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DIAS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs font-medium text-stone-600 block mb-1">{label}</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          {...register(`tarifasNoche.${key}` as `tarifasNoche.${Dia}`)}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Tarifas por día (pasadía) — solo si permite pasadía ─── */}
            {permitePasadia && (
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMostrarTarifasPasadia((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-sm font-medium text-stone-700"
                >
                  <span>Precios por día (pasadía)</span>
                  <span className="flex items-center gap-1.5 text-stone-400 text-xs font-normal shrink-0 ml-2">
                    <span className="hidden sm:inline">{mostrarTarifasPasadia ? 'Ocultar' : 'Opcional'}</span>
                    {mostrarTarifasPasadia ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {mostrarTarifasPasadia && (
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DIAS.map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-medium text-stone-600 block mb-1">{label}</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            {...register(`tarifasPasadia.${key}` as `tarifasPasadia.${Dia}`)}
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2 ─────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-stone-800 mb-3">Fotos del glamping</h2>
              <FotosUpload imagenes={imagenes} onChange={setImagenes} />
            </div>
            <div>
              <h2 className="font-semibold text-stone-800 mb-1">Ubicación</h2>
              <p className="text-xs text-stone-400 mb-3">Haz clic en el mapa para marcar el punto exacto de tu glamping</p>
              <MapaPicker
                lat={ubicacion.lat}
                lng={ubicacion.lng}
                onChange={(lat, lng) => setUbicacion({ lat, lng })}
              />
              <div className="mt-4">
                <Input label="Dirección (referencia)" placeholder="Km 12 vía La Calera, Vereda El Retiro" {...register('direccion')} />
              </div>
            </div>
            <Input label="Video de YouTube (opcional)" placeholder="https://youtube.com/watch?v=..." {...register('videoYoutube')} />
          </div>
        )}

        {/* ── Step 3 ─────────────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-stone-800 mb-3">Amenidades</h2>
              <div className="flex flex-wrap gap-2">
                {AMENIDADES_DISPONIBLES.map(({ id, label }) => (
                  <button key={id} type="button" onClick={() => toggleAmenidad(id)}
                    className={`px-4 py-2 rounded-full border text-sm transition-all ${
                      amenidades.includes(id) ? 'bg-brand text-white border-brand' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* ── Servicios adicionales ─────────────────────────────── */}
            <div>
              <h2 className="font-semibold text-stone-800 mb-1">Servicios adicionales</h2>
              <p className="text-xs text-stone-400 mb-3">
                Activa los que ofreces y ponles precio — el huésped los podrá contratar al reservar
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catalogoExtras.map((cat: CatalogoExtra) => {
                  const activo = !!extras[cat.key]
                  return (
                    <div
                      key={cat.key}
                      className={`rounded-xl border p-3 transition-colors ${activo ? 'border-emerald-400 bg-emerald-50' : 'border-stone-200 bg-white'}`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-brand"
                          checked={activo}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExtras((prev) => ({ ...prev, [cat.key]: { precio: 0, descripcion: '', unidad: cat.unidad } }))
                            } else {
                              setExtras((prev) => { const n = { ...prev }; delete n[cat.key]; return n })
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-stone-700 flex-1">{cat.nombre}</span>
                        {!activo && (
                          <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full shrink-0">
                            {UNIDAD_LABELS[cat.unidad]}
                          </span>
                        )}
                      </label>
                      {activo && (
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min={0}
                              placeholder="Precio COP"
                              value={extras[cat.key]?.precio || ''}
                              onChange={(e) => setExtras((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], precio: Number(e.target.value) } }))}
                              className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                            />
                            <select
                              value={extras[cat.key]?.unidad ?? cat.unidad}
                              onChange={(e) => setExtras((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], unidad: e.target.value } }))}
                              className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                            >
                              <option value="por_persona">por persona</option>
                              <option value="por_pareja">por pareja</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            placeholder="Descripción opcional"
                            value={extras[cat.key]?.descripcion || ''}
                            onChange={(e) => setExtras((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], descripcion: e.target.value } }))}
                            className="w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700 block">Política de cancelación</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('noCancelaciones')} className="accent-brand" />
                <span className="text-sm text-stone-700">No admite cancelaciones</span>
              </label>
              {!watch('noCancelaciones') && (
                <Input
                  label="Días de anticipación para cancelación gratuita"
                  type="number"
                  min={1}
                  placeholder="Ej: 15"
                  {...register('diasCancelacion')}
                />
              )}
            </div>
            <Textarea label="Políticas de la casa"
              placeholder="No mascotas. No fiestas. Silencio a partir de las 10pm." {...register('politicasCasa')} />

            {/* ── RNT ────────────────────────────────────────────── */}
            <div>
              <label className="text-sm font-medium text-stone-700 block mb-1">
                RNT — Registro Nacional de Turismo{' '}
                <span className="text-stone-400 font-normal">(opcional)</span>
              </label>
              <p className="text-xs text-stone-400 mb-3">
                Adjunta el PDF o imagen de tu registro. Esto genera mayor confianza en los huéspedes.
              </p>

              {rntUrl && !rntFile && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-3 text-sm text-brand-light">
                  <FileText size={16} className="shrink-0" />
                  <span className="flex-1 truncate">Documento cargado</span>
                  <a href={rntUrl} target="_blank" rel="noopener noreferrer" className="underline text-xs">Ver</a>
                  <button type="button" onClick={() => setRntUrl('')} className="text-stone-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              )}

              <label className="flex items-center gap-3 border-2 border-dashed border-stone-300 rounded-xl p-4 cursor-pointer hover:border-emerald-400 transition-colors">
                <Upload size={20} className="text-stone-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-600">
                    {rntFile ? rntFile.name : 'Seleccionar PDF o imagen'}
                  </p>
                  <p className="text-xs text-stone-400">PDF, JPG, PNG — máx 10 MB</p>
                </div>
                {rntFile && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setRntFile(null) }}
                    className="text-stone-400 hover:text-red-500 shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    setRntFile(f)
                    if (f) setRntUrl('')
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between items-center mt-6">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Anterior</Button>
          ) : <div />}

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <Button type="button" onClick={step === 1 ? avanzarStep1 : avanzarStep2}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" loading={publicar.isPending}>Publicar glamping</Button>
            )}
          </div>
        </div>
      </form>

      {/* Botón flotante — sticky dentro del contenedor, nunca pisa el footer */}
      <div className="sticky bottom-4 flex justify-end mt-4 pointer-events-none">
        <button
          type="button"
          disabled={guardando}
          onClick={async () => {
            let id = draftId
            if (!id) {
              const values = formValues
              if (!values.nombreGlamping?.trim() || !values.tipoGlamping) {
                toast.error('Completa al menos el nombre y tipo para guardar')
                return
              }
              try {
                const fd = new window.FormData()
                fd.append('nombreGlamping', toTitleCase(values.nombreGlamping))
                fd.append('tipoGlamping', values.tipoGlamping)
                const { data } = await api.post('/glampings/borrador', fd)
                id = data._id
                setDraftId(id)
              } catch (err) {
                toast.error(getErrorMessage(err))
                return
              }
            }
            await guardarEnApi(formValues, id!)
            await guardarImagenes(id!)
            toast.success('Guardado')
          }}
          className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-brand text-white shadow-lg hover:bg-brand-light active:scale-95 disabled:opacity-60 transition-all text-sm font-medium"
        >
          {guardando ? <Cloud size={16} className="animate-pulse" /> : <Cloud size={16} />}
          {guardando ? 'Guardando...' : 'Guardar ahora'}
        </button>
      </div>
    </div>
  )
}
