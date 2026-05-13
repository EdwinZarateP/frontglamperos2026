'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Users, MessageSquare, TrendingUp, Calendar, RefreshCw, Download } from 'lucide-react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

interface BotStats {
  periodo_dias: number
  fecha_inicio: string
  fecha_fin: string
  totales: {
    conversaciones_unicas: number
    total_mensajes: number
    promedio_mensajes_por_conversacion: number
  }
  por_dia: Array<{
    fecha: string
    conversaciones: number
    total_mensajes: number
    mensajes_usuario: number
    mensajes_bot: number
  }>
}

export default function AdminBotStatsPage() {
  const [dateRange, setDateRange] = useState<'30d' | '7d' | '90d' | 'custom'>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['bot-stats', dateRange, customStart, customEnd],
    queryFn: async () => {
      let url = '/bot/estadisticas?'
      if (dateRange === 'custom' && customStart && customEnd) {
        url += `fecha_inicio=${customStart}&fecha_fin=${customEnd}`
      } else {
        const dias = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30
        url += `dias=${dias}`
      }
      return (await api.get(url)).data as BotStats
    },
    refetchInterval: 60_000,
  })

  const fmtFechaStats = (fecha: string) => {
    const d = new Date(fecha + 'T00:00:00')
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  }

  const fmtDia = (fecha: string) => {
    const d = new Date(fecha + 'T00:00:00')
    return d.getDate().toString()
  }

  const fmtMes = (fecha: string) => {
    const d = new Date(fecha + 'T00:00:00')
    return d.toLocaleDateString('es-CO', { month: 'short' }).toLowerCase()
  }

  const fmtFechaCompleta = (fecha: string) => {
    const d = new Date(fecha + 'T00:00:00')
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  }

  const downloadCSV = () => {
    if (!stats) return

    const headers = ['Fecha', 'Conversaciones', 'Mensajes totales', 'Mensajes usuario', 'Mensajes bot']
    const rows = stats.por_dia.map(d => [
      d.fecha,
      d.conversaciones.toString(),
      d.total_mensajes.toString(),
      d.mensajes_usuario.toString(),
      d.mensajes_bot.toString()
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bot_stats_${stats.fecha_inicio}_to_${stats.fecha_fin}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Estadísticas del Bot</h1>
          <p className="text-sm text-stone-500 mt-0.5">Conversaciones y métricas de uso</p>
        </div>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-stone-400" />
            <span className="text-sm font-medium text-stone-700">Rango de fechas:</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-stone-200">
              <button
                onClick={() => setDateRange('7d')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === '7d'
                    ? 'bg-brand text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setDateRange('30d')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === '30d'
                    ? 'bg-brand text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => setDateRange('90d')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === '90d'
                    ? 'bg-brand text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                90 días
              </button>
              <button
                onClick={() => setDateRange('custom')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === 'custom'
                    ? 'bg-brand text-white'
                    : 'bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                Personalizado
              </button>
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <span className="text-stone-400">→</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  onClick={() => refetch()}
                  className="p-1.5 rounded-lg bg-brand hover:bg-brand-light text-white transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : stats ? (
        <>

          {/* Tarjetas de totales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50">
                  <Users className="text-emerald-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-medium uppercase">Conversaciones</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.totales.conversaciones_unicas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50">
                  <MessageSquare className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-medium uppercase">Mensajes totales</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.totales.total_mensajes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50">
                  <TrendingUp className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-medium uppercase">Promedio msg/conv</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">{stats.totales.promedio_mensajes_por_conversacion}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50">
                  <BarChart3 className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-medium uppercase">Por día (prom)</p>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">
                    {Math.round(stats.totales.conversaciones_unicas / stats.periodo_dias)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico principal */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-stone-900">Conversaciones por día</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {stats.fecha_inicio} → {stats.fecha_fin}
                </p>
              </div>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <Download size={14} />
                Exportar
              </button>
            </div>

            <div className="p-5">
              {/* Gráfico de barras - DISEÑO NUEVO */}
              <div className="space-y-4">
                {/* Contenedor principal */}
                <div className="bg-white rounded-xl border border-stone-200 p-6">

                  {/* Header del gráfico */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900">Conversaciones por día</h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {stats.fecha_inicio} → {stats.fecha_fin}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-500">Máximo del periodo</p>
                      <p className="text-lg font-bold text-brand">
                        {Math.max(...stats.por_dia.map(d => d.conversaciones))}
                      </p>
                    </div>
                  </div>

                  {/* Área del gráfico */}
                  <div className="relative" style={{ height: '300px' }}>

                    {/* Líneas de guía horizontales */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ paddingBottom: '40px' }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-full border-t border-stone-100"
                        />
                      ))}
                    </div>

                    {/* TODOS los días en un solo contenedor flex */}
                    <div className="absolute inset-0 flex items-end" style={{ paddingBottom: '40px' }}>
                      {stats.por_dia.map((dia, idx) => {
                        const maxVal = Math.max(...stats.por_dia.map(d => d.conversaciones), 1)
                        const alturaPx = (dia.conversaciones / maxVal) * 240
                        const esHoy = idx === stats.por_dia.length - 1

                        return (
                          <div
                            key={dia.fecha}
                            className="flex-1 flex flex-col items-center justify-end group relative"
                          >
                            {/* Tooltip */}
                            <div className="relative mb-2">
                              <div className={`
                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                bg-stone-800 text-white text-xs font-medium
                                px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100
                                transition-opacity whitespace-nowrap z-10
                                shadow-xl pointer-events-none
                              `}>
                                <div className="font-bold text-emerald-400">{dia.conversaciones} conversaciones</div>
                                <div className="text-[10px] text-stone-300">{fmtFechaCompleta(dia.fecha)}</div>
                                <div className="text-[10px] text-stone-400 mt-1">{dia.total_mensajes} mensajes</div>
                              </div>

                              {/* Número de conversaciones */}
                              <div className={`
                                text-center font-bold text-base mb-1
                                ${esHoy ? 'text-brand' : 'text-stone-700'}
                              `}>
                                {dia.conversaciones}
                              </div>
                            </div>

                            {/* Barra */}
                            <div
                              className={`
                                w-10 rounded-t-lg transition-all duration-300
                                ${esHoy
                                  ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/20'
                                  : 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500'
                                }
                                ${dia.conversaciones === 0 ? 'opacity-20' : ''}
                              `}
                              style={{
                                height: `${Math.max(alturaPx, dia.conversaciones > 0 ? 8 : 2)}px`,
                              }}
                            />

                            {/* Día del mes */}
                            <div className={`
                              text-[11px] mt-2 text-center font-medium
                              ${esHoy ? 'text-brand font-bold' : 'text-stone-600'}
                            `}>
                              {fmtDia(dia.fecha)}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Etiquetas de meses - ABAJO de los días */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 flex border-t border-stone-200">
                      {(() => {
                        // Calcular posición de cada mes
                        const gruposPorMes: { [key: string]: { dias: typeof stats.por_dia, startIdx: number, endIdx: number } } = {}

                        stats.por_dia.forEach((dia, idx) => {
                          const mes = new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
                          if (!gruposPorMes[mes]) {
                            gruposPorMes[mes] = { dias: [], startIdx: idx, endIdx: idx }
                          }
                          gruposPorMes[mes].dias.push(dia)
                          gruposPorMes[mes].endIdx = idx
                        })

                        const total = stats.por_dia.length

                        return Object.entries(gruposPorMes).map(([mes, grupo]) => {
                          const startPct = (grupo.startIdx / total) * 100
                          const endPct = ((grupo.endIdx + 1) / total) * 100
                          const widthPct = endPct - startPct

                          return (
                            <div
                              key={mes}
                              className="absolute top-0 bottom-0 flex items-center justify-center text-xs font-semibold text-stone-500 uppercase bg-stone-50 px-2"
                              style={{
                                left: `${startPct}%`,
                                width: `${widthPct}%`,
                              }}
                            >
                              {mes}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Leyenda */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-blue-500 to-blue-400" />
                      <span>Días normales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/20" />
                      <span>Hoy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de datos */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-900">Detalle por día</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-stone-600 uppercase">Fecha</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-stone-600 uppercase">Conversaciones</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-stone-600 uppercase">Mensajes totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stats.por_dia.map((dia) => (
                    <tr key={dia.fecha} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-stone-900">
                        {fmtFechaCompleta(dia.fecha)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold ${
                          dia.conversaciones > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-stone-100 text-stone-400'
                        }`}>
                          {dia.conversaciones}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-stone-600">{dia.total_mensajes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <BarChart3 size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500">Sin datos disponibles para el rango seleccionado</p>
        </div>
      )}
    </div>
  )
}
