'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Phone, Clock, RefreshCw, ArrowLeft, Calendar, X, Search, Copy, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

interface ConvResumen {
  telefono: string
  ultimoMensaje: string
  totalMensajes: number
}

interface Mensaje {
  rol: string
  mensaje: string
  timestamp: string
}

function fmtFecha(iso: string) {
  const d = new Date(iso)
  const ahora = new Date()
  const diff = ahora.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs}h`
  // Convertir a hora Colombia para la fecha
  const colombiaTime = new Date(d.getTime() - (5 * 60 * 60 * 1000))
  return colombiaTime.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function fmtHora(iso: string) {
  const d = new Date(iso)
  // Convertir a hora Colombia restando 5 horas (UTC-5)
  const colombiaTime = new Date(d.getTime() - (5 * 60 * 60 * 1000))
  return colombiaTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

function fmtFechaCompleta(iso: string) {
  const d = new Date(iso)
  // Convertir a hora Colombia restando 5 horas (UTC-5)
  const colombiaTime = new Date(d.getTime() - (5 * 60 * 60 * 1000))
  return colombiaTime.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function fmtFechaCorta(iso: string) {
  const d = new Date(iso)
  // Convertir a hora Colombia restando 5 horas (UTC-5)
  const colombiaTime = new Date(d.getTime() - (5 * 60 * 60 * 1000))
  return colombiaTime.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short'
  })
}

export default function AdminBotPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [copied, setCopied] = useState(false)

  // En móvil: true = mostrando chat, false = mostrando lista
  const [showChat, setShowChat] = useState(false)

  function selectConv(telefono: string) {
    setSelected(telefono)
    setShowChat(true)
  }

  function goBack() {
    setShowChat(false)
  }

  // Construir query params
  const buildListParams = () => {
    const p = new URLSearchParams({ limit: '500' })
    if (fechaInicio) p.set('fecha_inicio', fechaInicio)
    if (fechaFin) p.set('fecha_fin', fechaFin)
    if (searchPhone) p.set('telefono', searchPhone.replace(/\D/g, ''))
    return p
  }

  // Lista de conversaciones — refresca cada 15s
  const { data: listaData, isLoading: listaLoading, dataUpdatedAt } = useQuery({
    queryKey: ['bot-lista', fechaInicio, fechaFin, searchPhone],
    queryFn: async () => (await api.get(`/bot/conversaciones?${buildListParams().toString()}`)).data,
    refetchInterval: 15_000,
  })

  const conversaciones: ConvResumen[] = listaData?.conversaciones ?? []
  const totalConv = listaData?.total ?? 0

  // Historial de la conversación seleccionada — refresca cada 5s
  const histParams = new URLSearchParams({ limit: '200' })
  if (fechaInicio) histParams.set('fecha_inicio', fechaInicio)
  if (fechaFin) histParams.set('fecha_fin', fechaFin)

  const { data: historialData, isLoading: histLoading } = useQuery({
    queryKey: ['bot-historial', selected, fechaInicio, fechaFin],
    queryFn: async () => (await api.get(`/bot/conversaciones/${selected}?${histParams.toString()}`)).data,
    enabled: !!selected,
    refetchInterval: 5_000,
  })

  const mensajes: Mensaje[] = historialData?.mensajes ?? []

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4">

      {/* Panel izquierdo: lista de conversaciones */}
      <div className={`
        md:w-72 md:shrink-0 md:flex flex-col
        bg-white rounded-2xl border border-stone-200 overflow-hidden
        ${showChat ? 'hidden' : 'flex flex-1'}
        md:flex
      `}>
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-brand" />
            <span className="text-sm font-semibold text-stone-900">Conversaciones</span>
            {totalConv > 0 && (
              <span className="text-[11px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{totalConv}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            en vivo
          </div>
        </div>

        {/* Buscar por teléfono */}
        <div className="px-3 py-2 border-b border-stone-100">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearchPhone(phoneInput) }}
                placeholder="Número de teléfono..."
                className="w-full text-xs border border-stone-200 rounded-lg pl-8 pr-2 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-stone-300"
              />
            </div>
            <button
              onClick={() => setSearchPhone(phoneInput)}
              className="px-2.5 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Buscar
            </button>
            {searchPhone && (
              <button
                onClick={() => { setPhoneInput(''); setSearchPhone('') }}
                className="px-1.5 py-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filtro de fechas */}
        <div className="px-3 py-2 border-b border-stone-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <Calendar size={11} />
            <span>Filtrar por fechas</span>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Desde"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="flex-1 text-xs border border-stone-200 rounded-lg px-2 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Hasta"
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button
              onClick={() => { setFechaInicio(''); setFechaFin('') }}
              className="flex items-center gap-1 text-[11px] text-brand hover:text-emerald-700 transition-colors"
            >
              <X size={10} />
              Limpiar filtros
            </button>
          )}
        </div>

        {listaLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : conversaciones.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">
            {searchPhone ? 'Sin resultados para ese número' : 'Sin conversaciones aún'}
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {conversaciones.map((c) => (
              <li key={c.telefono}>
                <button
                  onClick={() => selectConv(c.telefono)}
                  className={`w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors
                    ${selected === c.telefono ? 'bg-emerald-50 border-l-2 border-brand' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 truncate">
                      +{c.telefono}
                    </span>
                    <span className="text-[11px] text-stone-400 shrink-0">
                      {fmtFecha(c.ultimoMensaje)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MessageCircle size={11} className="text-stone-300" />
                    <span className="text-xs text-stone-400">{c.totalMensajes} mensajes</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 py-2 border-t border-stone-100 flex items-center gap-1 text-[11px] text-stone-300">
          <RefreshCw size={10} />
          Actualizado {dataUpdatedAt ? fmtFecha(new Date(dataUpdatedAt).toISOString()) : '—'}
        </div>
      </div>

      {/* Panel derecho: historial */}
      <div className={`
        flex-1 bg-white rounded-2xl border border-stone-200 flex flex-col overflow-hidden
        ${showChat ? 'flex' : 'hidden'}
        md:flex
      `}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-300 gap-3">
            <Phone size={40} />
            <p className="text-sm">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between gap-3">
              {/* Botón volver — solo móvil */}
              <button
                onClick={goBack}
                className="md:hidden p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
                aria-label="Volver a conversaciones"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">+{selected}</p>
                <p className="text-xs text-stone-400">
                  {mensajes.length} mensajes
                  {mensajes.length > 0 && (
                    <span className="ml-1">· {fmtFechaCorta(mensajes[0].timestamp)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const text = mensajes.map(m =>
                      `[${fmtHora(m.timestamp)}] ${m.rol === 'user' ? '👤' : '🤖'}: ${m.mensaje}`
                    ).join('\n\n')
                    navigator.clipboard.writeText(text).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    })
                  }}
                  disabled={mensajes.length === 0}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Copiar conversación"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">actualizando cada 5s</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {histLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : mensajes.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-10">Sin mensajes</p>
              ) : (
                <>
                  {mensajes.map((m, i) => {
                    // Mostrar separador de fecha si cambia el día
                    const showDateSeparator = i === 0 || (
                      new Date(m.timestamp).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }) !==
                      new Date(mensajes[i - 1].timestamp).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
                    )

                    return (
                      <div key={i}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4">
                            <span className="text-[11px] font-medium text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                              {fmtFechaCompleta(m.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                              ${m.rol === 'user'
                                ? 'bg-emerald-500 text-white rounded-br-sm'
                                : 'bg-stone-100 text-stone-800 rounded-bl-sm'}`}
                          >
                            <p className="whitespace-pre-wrap break-words">{m.mensaje}</p>
                            <p className={`text-[10px] mt-1 text-right
                              ${m.rol === 'user' ? 'text-emerald-100' : 'text-stone-400'}`}>
                              {fmtHora(m.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
