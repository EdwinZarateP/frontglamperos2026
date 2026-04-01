'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQueries, useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Share2, Copy, Check, X, Trash2 } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Glamping { _id: string; nombreGlamping: string }
export interface Unidad   { _id: string; nombre: string }
export interface Bloqueo  {
  _id: string; tipo: string; fuente: string
  fecha?: string; fechaInicio?: string; fechaFin?: string
  unidadId?: string; metadata: Record<string, string>
}

// ── Color palette por glamping ────────────────────────────────────────────────
export const PALETA = [
  { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-brand' },
  { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500'    },
  { bg: 'bg-violet-100',  text: 'text-violet-800',  dot: 'bg-violet-500'  },
  { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500'   },
  { bg: 'bg-rose-100',    text: 'text-rose-800',    dot: 'bg-rose-500'    },
  { bg: 'bg-cyan-100',    text: 'text-cyan-800',    dot: 'bg-cyan-500'    },
]

// ── Date helpers ───────────────────────────────────────────────────────────────
export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function nextDay(fecha: string) {
  const d = new Date(fecha + 'T12:00:00')
  d.setDate(d.getDate() + 1)
  return toISO(d)
}
function diasMes(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const days: (string | null)[] = []
  let pad = first.getDay() - 1; if (pad < 0) pad = 6
  for (let i = 0; i < pad; i++) days.push(null)
  const total = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= total; d++)
    days.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  return days
}
export function cubre(b: Bloqueo, fecha: string) {
  if (b.tipo === 'PASADIA') return b.fecha === fecha
  return !!(b.fechaInicio && b.fechaFin && b.fechaInicio <= fecha && fecha < b.fechaFin)
}

const DIAS_SEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── CalendarioGrid (reutilizable en página pública) ────────────────────────────
export function CalendarioGrid({
  glampings,
  unidadesPorGlamping,
  bloqueosPorGlamping,
  year,
  month,
  onPrevMes,
  onNextMes,
  onDiaClick,
  selStart,
  selHover,
  onDiaHover,
}: {
  glampings: Glamping[]
  unidadesPorGlamping: Record<string, Unidad[]>
  bloqueosPorGlamping: Record<string, Bloqueo[]>
  year: number
  month: number
  onPrevMes: () => void
  onNextMes: () => void
  onDiaClick?: (fecha: string) => void
  selStart?: string | null
  selHover?: string | null
  onDiaHover?: (fecha: string | null) => void
}) {
  const today = toISO(new Date())
  const dias = useMemo(() => diasMes(year, month), [year, month])

  function ocupadosEnDia(fecha: string) {
    return glampings.flatMap((g, gi) => {
      const bloqueos = bloqueosPorGlamping[g._id] ?? []
      const unidades = unidadesPorGlamping[g._id] ?? []
      const color = PALETA[gi % PALETA.length]
      if (unidades.length <= 1) {
        if (!bloqueos.some((b) => cubre(b, fecha))) return []
        return [{ glamping: g, label: g.nombreGlamping, color }]
      }
      const ocupadas = unidades.filter((u) =>
        bloqueos.some((b) => cubre(b, fecha) && (!b.unidadId || b.unidadId === u._id))
      )
      if (!ocupadas.length) return []
      return [{ glamping: g, label: `${g.nombreGlamping} (${ocupadas.length}/${unidades.length})`, color }]
    })
  }

  function enRango(fecha: string) {
    if (!selStart) return false
    const end = selHover || selStart
    const [a, b] = selStart <= end ? [selStart, end] : [end, selStart]
    return fecha >= a && fecha <= b
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
        <button onClick={onPrevMes} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-stone-900">{MESES[month]} {year}</span>
        <button onClick={onNextMes} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-stone-100">
        {DIAS_SEM.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-stone-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-y divide-stone-100">
        {dias.map((fecha, i) => {
          if (!fecha) return <div key={`e${i}`} className="min-h-[5rem] bg-stone-50/30" />
          const ocupados = ocupadosEnDia(fecha)
          const isToday  = fecha === today
          const isPast   = fecha < today
          const inRange  = enRango(fecha)
          const isSelStart = fecha === selStart
          const clickable  = !!onDiaClick

          return (
            <div key={fecha}
              onClick={() => onDiaClick?.(fecha)}
              onMouseEnter={() => onDiaHover?.(fecha)}
              className={`min-h-[5rem] p-1.5 flex flex-col gap-0.5 transition-colors
                ${clickable ? 'cursor-pointer' : ''}
                ${inRange ? 'bg-emerald-50' : isPast ? 'bg-stone-50/40' : 'bg-white hover:bg-stone-50/60'}
                ${isSelStart ? 'ring-2 ring-inset ring-brand' : ''}`}>
              <span className={`text-xs font-semibold self-start w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? 'bg-brand text-white' : isPast ? 'text-stone-300' : 'text-stone-600'}`}>
                {parseInt(fecha.split('-')[2])}
              </span>
              {ocupados.map(({ glamping, label, color }) => (
                <span key={glamping._id}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate leading-tight ${color.bg} ${color.text}`}
                  title={label}>
                  {label}
                </span>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Página principal del anfitrión ────────────────────────────────────────────
export default function CalendarioAnfitrionPage() {
  const { user } = useAuthStore()
  const [mes, setMes] = useState(new Date())
  const [copiado, setCopiado] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')

  // Selección de rango
  const [selStart, setSelStart] = useState<string | null>(null)
  const [selHover, setSelHover] = useState<string | null>(null)

  // Modal de bloqueo
  const [modal, setModal] = useState({
    open: false,
    tipo: 'NOCHES' as 'NOCHES' | 'PASADIA',
    fechaInicio: '',
    fechaFin: '',
    glampingId: '',
    unidadId: '',
    nombreHuesped: '',
    telefonoHuesped: '',
    descripcion: '',
  })

  const year  = mes.getFullYear()
  const month = mes.getMonth()
  const userId = user?.id ?? (user as Record<string, string> | null)?._id

  useEffect(() => {
    if (userId) setPublicUrl(`${window.location.origin}/calendario/${userId}`)
  }, [userId])

  const copiarLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopiado(true)
    toast.success('Link copiado')
    setTimeout(() => setCopiado(false), 2000)
  }

  // Queries
  const { data: glampings = [], isLoading } = useQuery<Glamping[]>({
    queryKey: ['mis-glampings-cal', userId],
    queryFn: async () => (await api.get(`/glampings/por_propietario/${userId}`)).data,
    enabled: !!userId,
  })

  const unidadesQ = useQueries({
    queries: glampings.map((g) => ({
      queryKey: ['u-cal2', g._id],
      queryFn: async (): Promise<[string, Unidad[]]> => {
        const { data } = await api.get(`/glampings/${g._id}/unidades`)
        return [g._id, data]
      },
    })),
  })
  const bloqueosQ = useQueries({
    queries: glampings.map((g) => ({
      queryKey: ['b-cal2', g._id],
      queryFn: async (): Promise<[string, Bloqueo[]]> => {
        const { data } = await api.get(`/glampings/${g._id}/bloqueos`)
        return [g._id, data]
      },
    })),
  })

  const unidadesPorGlamping = useMemo(() =>
    Object.fromEntries(unidadesQ.flatMap((q) => q.data ? [q.data] : [])),
    [unidadesQ])

  const bloqueosPorGlamping = useMemo(() =>
    Object.fromEntries(bloqueosQ.flatMap((q) => q.data ? [q.data] : [])),
    [bloqueosQ])

  const loading = isLoading || unidadesQ.some((q) => q.isLoading) || bloqueosQ.some((q) => q.isLoading)

  // Unidades del glamping seleccionado en el modal
  const unidadesModal: Unidad[] = modal.glampingId ? (unidadesPorGlamping[modal.glampingId] ?? []) : []

  // Verifica si un glamping ya está completamente bloqueado en el rango del modal
  function glampingLlenoEnRango(g: Glamping): boolean {
    const bloqueos = bloqueosPorGlamping[g._id] ?? []
    const unidades = unidadesPorGlamping[g._id] ?? []
    const { tipo, fechaInicio, fechaFin } = modal
    if (!fechaInicio) return false

    // Construir lista de fechas del rango
    const fechas: string[] = []
    if (tipo === 'PASADIA') {
      fechas.push(fechaInicio)
    } else {
      let d = new Date(fechaInicio + 'T12:00:00')
      const fin = fechaFin || nextDay(fechaInicio)
      const endD = new Date(fin + 'T12:00:00')
      while (d < endD) { fechas.push(toISO(d)); d.setDate(d.getDate() + 1) }
    }
    if (!fechas.length) return false

    if (unidades.length <= 1) {
      // 1 unidad: cualquier día ya bloqueado = lleno
      return fechas.some((f) => bloqueos.some((b) => cubre(b, f)))
    } else {
      // Multi-unidad: lleno solo si TODAS las unidades están ocupadas en TODOS los días
      return fechas.every((f) =>
        unidades.every((u) =>
          bloqueos.some((b) => cubre(b, f) && (!b.unidadId || b.unidadId === u._id))
        )
      )
    }
  }

  // Mutation bloquear
  const refetchAll = () => {
    bloqueosQ.forEach((q) => q.refetch())
  }

  const eliminarBloqueo = useMutation({
    mutationFn: async ({ glampingId, bloqueoId }: { glampingId: string; bloqueoId: string }) => {
      await api.delete(`/glampings/${glampingId}/bloqueos/${bloqueoId}`)
    },
    onSuccess: () => {
      toast.success('Bloqueo eliminado')
      refetchAll()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const crearBloqueo = useMutation({
    mutationFn: async () => {
      const p: Record<string, string> = { tipo: modal.tipo, fuente: 'MANUAL' }
      if (modal.tipo === 'PASADIA') p.fecha = modal.fechaInicio
      else { p.fechaInicio = modal.fechaInicio; p.fechaFin = modal.fechaFin }
      if (modal.unidadId) p.unidadId = modal.unidadId
      if (modal.nombreHuesped) p.nombreHuesped = modal.nombreHuesped
      if (modal.telefonoHuesped) p.telefonoHuesped = modal.telefonoHuesped
      if (modal.descripcion) p.descripcion = modal.descripcion
      return (await api.post(`/glampings/${modal.glampingId}/bloqueos`, p)).data
    },
    onSuccess: () => {
      toast.success('Fechas bloqueadas')
      setModal((m) => ({ ...m, open: false, fechaInicio: '', fechaFin: '', nombreHuesped: '', telefonoHuesped: '', descripcion: '' }))
      setSelStart(null); setSelHover(null)
      refetchAll()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // Manejo de clic en día
  const handleDiaClick = (fecha: string) => {
    if (!selStart) {
      setSelStart(fecha)
    } else {
      const inicio = selStart <= fecha ? selStart : fecha
      const fin    = selStart <= fecha ? fecha   : selStart
      const finNoches = fin <= inicio ? nextDay(inicio) : fin

      // Auto-seleccionar glamping si hay exactamente 1 disponible (no lleno)
      const disponibles = glampings.filter((g) => {
        const bloqueos = bloqueosPorGlamping[g._id] ?? []
        const unidades = unidadesPorGlamping[g._id] ?? []
        const fechas: string[] = []
        let d = new Date(inicio + 'T12:00:00')
        const endD = new Date(finNoches + 'T12:00:00')
        while (d < endD) { fechas.push(toISO(d)); d.setDate(d.getDate() + 1) }
        if (unidades.length <= 1) {
          return !fechas.some((f) => bloqueos.some((b) => cubre(b, f)))
        }
        return !fechas.every((f) =>
          unidades.every((u) => bloqueos.some((b) => cubre(b, f) && (!b.unidadId || b.unidadId === u._id)))
        )
      })
      const autoGlampingId = disponibles.length === 1 ? disponibles[0]._id : ''

      setModal((m) => ({
        ...m,
        open: true,
        fechaInicio: inicio,
        fechaFin: finNoches,
        glampingId: autoGlampingId,
        unidadId: '',
      }))
      setSelStart(null); setSelHover(null)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-stone-900">Calendario</h1>
        <button onClick={copiarLink}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
          {copiado ? <Check size={15} className="text-brand" /> : <Share2 size={15} />}
          {copiado ? 'Copiado' : 'Compartir link'}
        </button>
      </div>

      {/* Link público */}
      {publicUrl && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <span className="text-xs text-brand-light flex-1 truncate">{publicUrl}</span>
          <button onClick={copiarLink} className="shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 text-brand-light transition-colors">
            <Copy size={14} />
          </button>
        </div>
      )}

      {/* Ocupación del mes + leyenda */}
      {glampings.length > 0 && (() => {
        const diasDelMes = new Date(year, month + 1, 0).getDate()
        const todasFechas: string[] = Array.from({ length: diasDelMes }, (_, d) =>
          `${year}-${String(month + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`
        )

        return (
          <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 space-y-3">
            {/* Ocupación por glamping */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {glampings.map((g, gi) => {
                const bloqueos = bloqueosPorGlamping[g._id] ?? []
                const unidades = unidadesPorGlamping[g._id] ?? []
                const nUnidades = Math.max(unidades.length, 1)
                const color = PALETA[gi % PALETA.length]

                // Suma de unidades ocupadas por día
                const totalOcupado = todasFechas.reduce((sum, f) => {
                  if (unidades.length <= 1) {
                    return sum + (bloqueos.some((b) => cubre(b, f)) ? 1 : 0)
                  }
                  const ocupadas = unidades.filter((u) =>
                    bloqueos.some((b) => cubre(b, f) && (!b.unidadId || b.unidadId === u._id))
                  ).length
                  return sum + ocupadas
                }, 0)

                const pct = Math.round((totalOcupado / (nUnidades * diasDelMes)) * 100)

                return (
                  <div key={g._id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl ${color.bg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                      <span className={`text-xs font-medium truncate ${color.text}`}>{g.nombreGlamping}</span>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${color.text}`}>{pct}%</span>
                  </div>
                )
              })}
            </div>

            {/* Hint */}
            <p className="text-xs text-stone-400 text-right">
              {selStart ? `→ Clic en el día final del rango (inicio: ${selStart})` : '1 clic = día · 2 clics = rango'}
            </p>
          </div>
        )
      })()}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : glampings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400">No tienes glampings publicados aún.</p>
          <Link href="/anfitrion/glampings/nuevo" className="text-brand text-sm hover:underline mt-2 inline-block">
            + Publicar glamping
          </Link>
        </div>
      ) : (
        <CalendarioGrid
          glampings={glampings}
          unidadesPorGlamping={unidadesPorGlamping}
          bloqueosPorGlamping={bloqueosPorGlamping}
          year={year}
          month={month}
          onPrevMes={() => setMes(new Date(year, month - 1, 1))}
          onNextMes={() => setMes(new Date(year, month + 1, 1))}
          onDiaClick={handleDiaClick}
          selStart={selStart}
          selHover={selHover}
          onDiaHover={(f) => selStart && setSelHover(f)}
        />
      )}

      {/* Hint selección activa */}
      {selStart && !modal.open && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl z-50 flex items-center gap-3">
          <span>Inicio: <strong>{selStart}</strong> — clic en el día final</span>
          <button onClick={() => { setSelStart(null); setSelHover(null) }} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Lista de bloqueos del mes ─────────────────────────────────────── */}
      {glampings.length > 0 && (() => {
        const mesStr = `${year}-${String(month + 1).padStart(2, '0')}`
        const FUENTE_LABEL: Record<string, string> = { MANUAL: 'Manual', AIRBNB: 'Airbnb', BOOKING: 'Booking', RESERVA: 'Reserva' }
        const FUENTE_COLOR: Record<string, string> = {
          MANUAL:  'bg-stone-100 text-stone-600',
          AIRBNB:  'bg-rose-100  text-rose-700',
          BOOKING: 'bg-blue-100  text-blue-700',
          RESERVA: 'bg-amber-100 text-amber-700',
        }
        const items: { glampingId: string; glampingNombre: string; b: Bloqueo }[] = []
        glampings.forEach((g) => {
          const bs: Bloqueo[] = bloqueosPorGlamping[g._id] ?? []
          bs.forEach((b) => {
            const fechaRef = b.fecha ?? b.fechaInicio ?? ''
            if (fechaRef.startsWith(mesStr)) items.push({ glampingId: g._id, glampingNombre: g.nombreGlamping, b })
          })
        })
        items.sort((a, b) => (a.b.fecha ?? a.b.fechaInicio ?? '') < (b.b.fecha ?? b.b.fechaInicio ?? '') ? -1 : 1)

        return (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <p className="text-sm font-semibold text-stone-800">Bloqueos en {mes.toLocaleString('es', { month: 'long', year: 'numeric' })}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-stone-400 px-4 py-6 text-center">Sin bloqueos este mes</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {items.map(({ glampingId, glampingNombre, b }) => {
                  const fmtFecha = (iso?: string) => {
                    if (!iso) return ''
                    const [y, m, d] = iso.split('-')
                    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
                    return `${parseInt(d)} ${meses[parseInt(m)-1]} ${y}`
                  }
                  const esPasadia = b.tipo === 'PASADIA'
                  const fechas = esPasadia
                    ? fmtFecha(b.fecha)
                    : `${fmtFecha(b.fechaInicio)} → ${fmtFecha(b.fechaFin)}`
                  const huesped = b.metadata?.nombreHuesped
                  const canDelete = b.fuente === 'MANUAL'
                  return (
                    <li key={b._id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${FUENTE_COLOR[b.fuente] ?? 'bg-stone-100 text-stone-600'}`}>
                        {FUENTE_LABEL[b.fuente] ?? b.fuente}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-800 truncate">
                          <span className="font-medium">{glampingNombre}</span>
                          {huesped && <span className="text-stone-400"> · {huesped}</span>}
                        </p>
                        <p className="text-xs text-stone-400 flex items-center gap-1.5">
                          <span>{esPasadia ? '☀️ Pasadía' : '🌙 Noches'}</span>
                          <span>·</span>
                          <span>{fechas}</span>
                        </p>
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este bloqueo?')) {
                              eliminarBloqueo.mutate({ glampingId, bloqueoId: b._id })
                            }
                          }}
                          className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Eliminar bloqueo">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })()}

      {/* ── Modal de bloqueo ─────────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal((m) => ({ ...m, open: false })) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900">Bloquear fechas</h3>
              <button onClick={() => setModal((m) => ({ ...m, open: false }))}
                className="p-1 rounded-lg hover:bg-stone-100"><X size={18} /></button>
            </div>

            {/* Propiedad */}
            <div>
              <label className="text-xs font-medium text-stone-500 block mb-1">¿En cuál propiedad?</label>
              <div className="grid grid-cols-1 gap-2">
                {glampings.map((g, gi) => {
                  const lleno = glampingLlenoEnRango(g)
                  return (
                    <button key={g._id} type="button"
                      disabled={lleno}
                      onClick={() => !lleno && setModal((m) => ({ ...m, glampingId: g._id, unidadId: '' }))}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-colors
                        ${lleno
                          ? 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
                          : modal.glampingId === g._id
                            ? 'border-brand bg-emerald-50 text-emerald-800'
                            : 'border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'}`}>
                      <div className={`w-3 h-3 rounded-full shrink-0 ${PALETA[gi % PALETA.length].dot} ${lleno ? 'opacity-30' : ''}`} />
                      <span className="flex-1">{g.nombreGlamping}</span>
                      {lleno && <span className="text-[11px] font-normal text-stone-400">Ya bloqueado</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Unidad (si hay más de 1) */}
            {modal.glampingId && unidadesModal.length > 1 && (
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">¿Qué unidad?</label>
                <select value={modal.unidadId}
                  onChange={(e) => setModal((m) => ({ ...m, unidadId: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white">
                  <option value="">Todas las unidades</option>
                  {unidadesModal.map((u) => <option key={u._id} value={u._id}>{u.nombre}</option>)}
                </select>
              </div>
            )}

            {/* Tipo */}
            <div className="flex gap-2">
              {(['NOCHES', 'PASADIA'] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setModal((m) => ({
                    ...m, tipo: t,
                    fechaFin: t === 'NOCHES' && m.fechaInicio && m.fechaFin <= m.fechaInicio ? nextDay(m.fechaInicio) : m.fechaFin,
                  }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${modal.tipo === t ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                  {t === 'NOCHES' ? '🌙 Noches' : '☀️ Pasadía'}
                </button>
              ))}
            </div>

            {/* Fechas */}
            {modal.tipo === 'NOCHES' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Check-in</label>
                  <input type="date" value={modal.fechaInicio}
                    onChange={(e) => setModal((m) => ({
                      ...m, fechaInicio: e.target.value,
                      fechaFin: m.fechaFin <= e.target.value ? nextDay(e.target.value) : m.fechaFin,
                    }))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Check-out</label>
                  <input type="date" value={modal.fechaFin}
                    min={modal.fechaInicio ? nextDay(modal.fechaInicio) : undefined}
                    onChange={(e) => setModal((m) => ({ ...m, fechaFin: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">Fecha</label>
                <input type="date" value={modal.fechaInicio}
                  onChange={(e) => setModal((m) => ({ ...m, fechaInicio: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            )}

            {/* Datos huésped opcionales */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-medium">
                Datos del huésped <span className="font-normal">(opcional — para reservas externas)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Nombre</label>
                  <input value={modal.nombreHuesped}
                    onChange={(e) => setModal((m) => ({ ...m, nombreHuesped: e.target.value }))}
                    placeholder="Juan García"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Teléfono</label>
                  <input value={modal.telefonoHuesped}
                    onChange={(e) => setModal((m) => ({ ...m, telefonoHuesped: e.target.value }))}
                    placeholder="3001234567"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">Servicios / notas</label>
                <input value={modal.descripcion}
                  onChange={(e) => setModal((m) => ({ ...m, descripcion: e.target.value }))}
                  placeholder="Desayuno, transporte, observaciones..."
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              </div>
            </div>

            <Button onClick={() => crearBloqueo.mutate()} loading={crearBloqueo.isPending} fullWidth
              disabled={!modal.glampingId || !modal.fechaInicio || (modal.tipo === 'NOCHES' && !modal.fechaFin)}>
              Bloquear fechas
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
