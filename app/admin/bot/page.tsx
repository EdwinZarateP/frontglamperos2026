'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Phone, Clock, RefreshCw } from 'lucide-react'
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
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminBotPage() {
  const [selected, setSelected] = useState<string | null>(null)

  // Lista de conversaciones — refresca cada 15s
  const { data: listaData, isLoading: listaLoading, dataUpdatedAt } = useQuery({
    queryKey: ['bot-lista'],
    queryFn: async () => (await api.get('/bot/conversaciones?limit=100')).data,
    refetchInterval: 15_000,
  })

  const conversaciones: ConvResumen[] = listaData?.conversaciones ?? []

  // Historial de la conversación seleccionada — refresca cada 5s
  const { data: historialData, isLoading: histLoading } = useQuery({
    queryKey: ['bot-historial', selected],
    queryFn: async () => (await api.get(`/bot/conversaciones/${selected}?limit=200`)).data,
    enabled: !!selected,
    refetchInterval: 5_000,
  })

  const mensajes: Mensaje[] = historialData?.mensajes ?? []

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4">

      {/* Panel izquierdo: lista de conversaciones */}
      <div className="w-72 shrink-0 bg-white rounded-2xl border border-stone-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-brand" />
            <span className="text-sm font-semibold text-stone-900">Conversaciones</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            en vivo
          </div>
        </div>

        {listaLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : conversaciones.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">Sin conversaciones aún</p>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {conversaciones.map((c) => (
              <li key={c.telefono}>
                <button
                  onClick={() => setSelected(c.telefono)}
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
      <div className="flex-1 bg-white rounded-2xl border border-stone-200 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-300 gap-3">
            <Phone size={40} />
            <p className="text-sm">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-900">+{selected}</p>
                <p className="text-xs text-stone-400">{mensajes.length} mensajes</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                actualizando cada 5s
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {histLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : mensajes.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-10">Sin mensajes</p>
              ) : (
                mensajes.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
                        ${m.rol === 'user'
                          ? 'bg-emerald-500 text-white rounded-br-sm'
                          : 'bg-stone-100 text-stone-800 rounded-bl-sm'}`}
                    >
                      <p className="whitespace-pre-wrap">{m.mensaje}</p>
                      <p className={`text-[10px] mt-1 text-right
                        ${m.rol === 'user' ? 'text-emerald-100' : 'text-stone-400'}`}>
                        {fmtHora(m.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
