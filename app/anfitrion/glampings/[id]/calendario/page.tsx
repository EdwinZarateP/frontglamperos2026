'use client'

import { use, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeft, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/Button'

// ── Types ─────────────────────────────────────────────────────────────────────
interface UnidadItem { _id: string; nombre: string; numero: number }

interface BloqueoItem {
  _id: string
  tipo: string
  fecha?: string
  fechaInicio?: string
  fechaFin?: string
  fuente: string
  unidadId?: string
  metadata: Record<string, string>
}

// ── Color config ───────────────────────────────────────────────────────────────
const FUENTE: Record<string, { dot: string; cell: string; badge: string; label: string }> = {
  AIRBNB:  { dot: 'bg-rose-500',   cell: 'bg-rose-300',   badge: 'bg-rose-100 text-rose-700',   label: 'Airbnb' },
  BOOKING: { dot: 'bg-blue-500',   cell: 'bg-blue-300',   badge: 'bg-blue-100 text-blue-700',   label: 'Booking' },
  RESERVA: { dot: 'bg-orange-500', cell: 'bg-orange-300', badge: 'bg-orange-100 text-orange-700', label: 'Glamperos' },
  MANUAL:  { dot: 'bg-stone-400',  cell: 'bg-stone-300',  badge: 'bg-stone-100 text-stone-600',  label: 'Manual' },
}

const DIAS_SEM = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ── Date helpers ───────────────────────────────────────────────────────────────
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
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
function cubre(b: BloqueoItem, fecha: string): boolean {
  if (b.tipo === 'PASADIA') return b.fecha === fecha
  return !!(b.fechaInicio && b.fechaFin && b.fechaInicio <= fecha && fecha < b.fechaFin)
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CalendarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const today = toISO(new Date())
  const [mes, setMes] = useState(new Date())
  const [vista, setVista] = useState<'mes' | 'macro'>('mes')
  const [unidadTab, setUnidadTab] = useState('todas')
  const [selStart, setSelStart] = useState<string | null>(null)
  const [selHover, setSelHover] = useState<string | null>(null)
  const [modal, setModal] = useState({
    open: false,
    tipo: 'NOCHES' as 'NOCHES' | 'PASADIA',
    fechaInicio: '',
    fechaFin: '',
    unidadId: '',
    nombreHuesped: '',
    telefonoHuesped: '',
    descripcion: '',
  })

  const year = mes.getFullYear()
  const month = mes.getMonth()
  const dias = useMemo(() => diasMes(year, month), [year, month])
  const totalDias = new Date(year, month + 1, 0).getDate()

  // Queries
  const { data: glamping } = useQuery({
    queryKey: ['g-cal', id],
    queryFn: async () => (await api.get(`/glampings/${id}`)).data,
  })
  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['u-cal', id],
    queryFn: async () => (await api.get(`/glampings/${id}/unidades`)).data,
  })
  const { data: bloqueos = [], refetch } = useQuery<BloqueoItem[]>({
    queryKey: ['b-cal', id],
    queryFn: async () => (await api.get(`/glampings/${id}/bloqueos`)).data,
  })

  // Mutations
  const crear = useMutation({
    mutationFn: async () => {
      const p: Record<string, string> = { tipo: modal.tipo, fuente: 'MANUAL' }
      if (modal.tipo === 'PASADIA') p.fecha = modal.fechaInicio
      else { p.fechaInicio = modal.fechaInicio; p.fechaFin = modal.fechaFin || modal.fechaInicio }
      if (modal.unidadId) p.unidadId = modal.unidadId
      if (modal.nombreHuesped) p.nombreHuesped = modal.nombreHuesped
      if (modal.telefonoHuesped) p.telefonoHuesped = modal.telefonoHuesped
      if (modal.descripcion) p.descripcion = modal.descripcion
      return (await api.post(`/glampings/${id}/bloqueos`, p)).data
    },
    onSuccess: () => {
      toast.success('Fechas bloqueadas')
      setModal((m) => ({ ...m, open: false, fechaInicio: '', fechaFin: '', nombreHuesped: '', telefonoHuesped: '', descripcion: '' }))
      setSelStart(null); setSelHover(null)
      refetch()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })
  const eliminar = useMutation({
    mutationFn: (bid: string) => api.delete(`/glampings/${id}/bloqueos/${bid}`),
    onSuccess: () => { toast.success('Bloqueo eliminado'); refetch() },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  // Helpers
  const getB = useCallback((fecha: string, uid?: string): BloqueoItem[] =>
    bloqueos.filter((b) => {
      if (!cubre(b, fecha)) return false
      if (uid && uid !== 'todas') return !b.unidadId || b.unidadId === uid
      return true
    }), [bloqueos])

  const enRango = (fecha: string): boolean => {
    if (!selStart) return false
    const end = selHover || selStart
    const [a, b] = selStart <= end ? [selStart, end] : [end, selStart]
    return fecha >= a && fecha <= b
  }

  const nextDay = (fecha: string) => {
    const d = new Date(fecha + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    return toISO(d)
  }

  const handleDiaClick = (fecha: string, uid?: string) => {
    if (!selStart) {
      setSelStart(fecha)
    } else {
      const inicio = selStart <= fecha ? selStart : fecha
      const fin   = selStart <= fecha ? fecha   : selStart
      const unidadId = uid ?? (unidadTab !== 'todas' ? unidadTab : (unidades[0]?._id ?? ''))
      // Para noches: fin debe ser al menos inicio+1
      const finNoches = fin <= inicio ? nextDay(inicio) : fin
      setModal((m) => ({ ...m, open: true, fechaInicio: inicio, fechaFin: finNoches, unidadId }))
      setSelStart(null); setSelHover(null)
    }
  }

  const bloqueosMes = useMemo(() => {
    const prefix = `${year}-${String(month+1).padStart(2,'0')}`
    return bloqueos.filter((b) => (b.fecha ?? b.fechaInicio ?? '').startsWith(prefix))
  }, [bloqueos, year, month])

  const prevMes = () => setMes(new Date(year, month - 1, 1))
  const nextMes = () => setMes(new Date(year, month + 1, 1))

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/anfitrion/glampings/${id}`}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 mb-1">
            <ArrowLeft size={14} /> Volver a edición
          </Link>
          <h1 className="text-xl font-bold text-stone-900">
            Calendario {glamping ? `— ${glamping.nombreGlamping}` : ''}
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setVista('mes')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${vista === 'mes' ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-300 text-stone-600'}`}>
            Por unidad
          </button>
          <button onClick={() => setVista('macro')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${vista === 'macro' ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-300 text-stone-600'}`}>
            Vista general
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-white border border-stone-200 rounded-xl px-4 py-3">
        {Object.entries(FUENTE).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${v.dot}`} />
            <span className="text-stone-600">{v.label}</span>
          </div>
        ))}
        <span className="text-stone-400 ml-auto hidden sm:block text-xs">
          {selStart ? `→ Clic en el día final del rango (inicio: ${selStart})` : '1 clic = día · 2 clics = rango'}
        </span>
      </div>

      {/* ── VISTA POR UNIDAD ─────────────────────────────────────────────────── */}
      {vista === 'mes' ? (
        <div className="space-y-4">

          {/* Tabs unidades */}
          {unidades.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([{ _id: 'todas', nombre: 'Todas las unidades' }, ...unidades]).map((u) => (
                <button key={u._id} onClick={() => setUnidadTab(u._id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${unidadTab === u._id ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-stone-600'}`}>
                  {u.nombre}
                </button>
              ))}
            </div>
          )}

          {/* Calendario */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <button onClick={prevMes} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="font-semibold text-stone-900">{MESES[month]} {year}</span>
              <button onClick={nextMes} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-stone-100">
              {DIAS_SEM.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-stone-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {dias.map((fecha, i) => {
                if (!fecha) return <div key={`e${i}`} className="h-16 sm:h-20 border-r border-b border-stone-50" />
                const bs = getB(fecha, unidadTab)
                const inRange = enRango(fecha)
                const isToday = fecha === today
                const isPast = fecha < today
                const isSelStart = fecha === selStart
                return (
                  <div key={fecha}
                    onClick={() => handleDiaClick(fecha)}
                    onMouseEnter={() => selStart && setSelHover(fecha)}
                    className={`min-h-[4rem] sm:min-h-[5rem] p-1.5 border-r border-b border-stone-100 cursor-pointer transition-colors
                      ${inRange ? 'bg-emerald-50' : isPast ? 'bg-stone-50/40 opacity-70' : 'hover:bg-stone-50'}
                      ${isSelStart ? 'ring-2 ring-inset ring-emerald-500' : ''}`}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${isToday ? 'bg-emerald-600 text-white' : isPast ? 'text-stone-300' : 'text-stone-700'}`}>
                      {parseInt(fecha.split('-')[2])}
                    </span>

                    {/* Puntos de color por fuente */}
                    <div className="flex flex-wrap gap-0.5">
                      {bs.map((b) => {
                        const cfg = FUENTE[b.fuente] ?? FUENTE.MANUAL
                        const u = unidades.find((u) => u._id === b.unidadId)
                        return (
                          <div key={b._id}
                            title={`${cfg.label}${u ? ` · ${u.nombre}` : ''}${b.metadata?.nombreHuesped ? ` · ${b.metadata.nombreHuesped}` : ''}`}
                            className={`w-2.5 h-2.5 rounded-full ${cfg.dot} cursor-pointer`} />
                        )
                      })}
                    </div>

                    {/* Nombre huésped si hay bloqueo manual con datos */}
                    {bs.length === 1 && bs[0].metadata?.nombreHuesped && (
                      <p className="text-xs text-stone-500 leading-tight mt-0.5 truncate hidden sm:block">
                        {bs[0].metadata.nombreHuesped}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      ) : (
        /* ── VISTA MACRO ─────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <button onClick={prevMes} className="p-2 rounded-lg hover:bg-stone-100"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-stone-900">{MESES[month]} {year}</span>
            <button onClick={nextMes} className="p-2 rounded-lg hover:bg-stone-100"><ChevronRight size={18} /></button>
          </div>

          <div className="overflow-x-auto">
            <table className="text-xs border-collapse" style={{ minWidth: `${totalDias * 32 + 128}px` }}>
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 w-32 px-3 py-2 text-left text-stone-500 border-b border-stone-100 font-medium">
                    Unidad
                  </th>
                  {Array.from({ length: totalDias }, (_, i) => {
                    const d = i + 1
                    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                    return (
                      <th key={d} className={`w-8 text-center py-2 border-b border-stone-100 font-medium
                        ${dateStr === today ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400'}`}>
                        {d}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => (
                  <tr key={u._id} className="group">
                    <td className="sticky left-0 bg-white z-10 px-3 py-2 font-medium text-stone-700 border-b border-stone-50 group-hover:bg-stone-50 max-w-[8rem] truncate">
                      {u.nombre}
                    </td>
                    {Array.from({ length: totalDias }, (_, i) => {
                      const d = i + 1
                      const fecha = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                      const bs = getB(fecha, u._id)
                      const topB = bs[0]
                      const cfg = topB ? (FUENTE[topB.fuente] ?? FUENTE.MANUAL) : null
                      const isPast = fecha < today
                      const isToday = fecha === today
                      return (
                        <td key={d}
                          onClick={() => handleDiaClick(fecha, u._id)}
                          title={topB
                            ? `${FUENTE[topB.fuente]?.label ?? 'Manual'}${topB.metadata?.nombreHuesped ? ` · ${topB.metadata.nombreHuesped}` : ''}`
                            : fecha}
                          className={`w-8 h-8 border border-stone-100 cursor-pointer text-center align-middle transition-colors
                            ${cfg ? cfg.cell : isPast ? 'bg-stone-50' : isToday ? 'bg-emerald-50' : 'hover:bg-emerald-50'}`}
                        >
                          {isToday && !cfg && (
                            <div className="w-1 h-1 rounded-full bg-emerald-500 mx-auto" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {unidades.length === 0 && (
            <p className="text-stone-400 text-sm text-center py-8">No hay unidades configuradas.</p>
          )}
        </div>
      )}

      {/* ── Lista bloqueos del mes ───────────────────────────────────────────── */}
      {bloqueosMes.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
          <h3 className="font-semibold text-stone-800 text-sm">{MESES[month]} {year} — Bloqueos</h3>
          <div className="space-y-2">
            {bloqueosMes.map((b) => {
              const cfg = FUENTE[b.fuente] ?? FUENTE.MANUAL
              const u = unidades.find((u) => u._id === b.unidadId)
              return (
                <div key={b._id} className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-200 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-800">
                        {b.tipo === 'PASADIA' ? b.fecha : `${b.fechaInicio} → ${b.fechaFin}`}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500`}>
                        {b.tipo === 'PASADIA' ? 'Pasadía' : 'Noches'}
                      </span>
                      {u && <span className="text-xs text-stone-400">{u.nombre}</span>}
                    </div>
                    {b.metadata?.nombreHuesped && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        👤 {b.metadata.nombreHuesped}
                        {b.metadata.telefonoHuesped && ` · 📞 ${b.metadata.telefonoHuesped}`}
                      </p>
                    )}
                    {b.metadata?.descripcion && (
                      <p className="text-xs text-stone-400 mt-0.5">{b.metadata.descripcion}</p>
                    )}
                  </div>
                  {b.fuente === 'MANUAL' && (
                    <button onClick={() => eliminar.mutate(b._id)} disabled={eliminar.isPending}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bloqueosMes.length === 0 && (
        <p className="text-sm text-stone-400 text-center py-4">Sin bloqueos en {MESES[month]}.</p>
      )}

      {/* ── Hint selección activa ────────────────────────────────────────────── */}
      {selStart && !modal.open && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl z-50 flex items-center gap-3">
          <span>Inicio: <strong>{selStart}</strong> — haz clic en el día final</span>
          <button onClick={() => { setSelStart(null); setSelHover(null) }} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Modal de bloqueo ─────────────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal((m) => ({ ...m, open: false })) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900">Bloquear fechas</h3>
              <button onClick={() => setModal((m) => ({ ...m, open: false }))}
                className="p-1 rounded-lg hover:bg-stone-100"><X size={18} /></button>
            </div>

            {/* Tipo */}
            <div className="flex gap-2">
              {(['NOCHES', 'PASADIA'] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setModal((m) => ({
                    ...m,
                    tipo: t,
                    // Al cambiar a NOCHES, garantizar fechaFin > fechaInicio
                    fechaFin: t === 'NOCHES' && m.fechaInicio && m.fechaFin <= m.fechaInicio
                      ? nextDay(m.fechaInicio)
                      : m.fechaFin,
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
                    onChange={(e) => {
                      const ini = e.target.value
                      setModal((m) => ({
                        ...m,
                        fechaInicio: ini,
                        // Si la salida quedó antes o igual que la entrada, avanzar un día
                        fechaFin: m.fechaFin <= ini ? nextDay(ini) : m.fechaFin,
                      }))
                    }}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Check-out</label>
                  <input type="date" value={modal.fechaFin}
                    min={modal.fechaInicio ? nextDay(modal.fechaInicio) : undefined}
                    onChange={(e) => setModal((m) => ({ ...m, fechaFin: e.target.value }))}
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">Fecha</label>
                <input type="date" value={modal.fechaInicio}
                  onChange={(e) => setModal((m) => ({ ...m, fechaInicio: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            )}

            {/* Unidad */}
            {unidades.length > 1 && (
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">Alojamiento</label>
                <select value={modal.unidadId}
                  onChange={(e) => setModal((m) => ({ ...m, unidadId: e.target.value }))}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="">Todas las unidades</option>
                  {unidades.map((u) => <option key={u._id} value={u._id}>{u.nombre}</option>)}
                </select>
              </div>
            )}

            {/* Datos huésped */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-medium">
                Datos del huésped <span className="font-normal">(opcional — para reservas externas no hechas en Glamperos)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Nombre</label>
                  <input value={modal.nombreHuesped}
                    onChange={(e) => setModal((m) => ({ ...m, nombreHuesped: e.target.value }))}
                    placeholder="Juan García"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 block mb-1">Teléfono</label>
                  <input value={modal.telefonoHuesped}
                    onChange={(e) => setModal((m) => ({ ...m, telefonoHuesped: e.target.value }))}
                    placeholder="3001234567"
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">Servicios / notas</label>
                <input value={modal.descripcion}
                  onChange={(e) => setModal((m) => ({ ...m, descripcion: e.target.value }))}
                  placeholder="Desayuno, transporte, observaciones..."
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <Button onClick={() => crear.mutate()} loading={crear.isPending} fullWidth
              disabled={!modal.fechaInicio || (modal.tipo === 'NOCHES' && !modal.fechaFin)}>
              Bloquear fechas
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
