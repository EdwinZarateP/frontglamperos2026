'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Users, MessageSquare, TrendingUp, Calendar, RefreshCw, Download, Clock } from 'lucide-react'
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
  }>
}

interface BotStatsHoras {
  periodo_dias: number
  por_hora: Array<{
    hora: string
    total_mensajes: number
    conversaciones: number
  }>
  hora_pico: {
    hora: string
    total_mensajes: number
    conversaciones: number
  } | null
  total_mensajes: number
}

interface BotStatsDiaSemana {
  periodo_dias: number
  por_dia_semana: Array<{
    dia_semana: string
    conversaciones: number
    total_mensajes: number
  }>
  dia_mas_activo: {
    dia_semana: string
    conversaciones: number
    total_mensajes: number
  } | null
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

  const diasParam = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30

  // Estadísticas por hora
  const { data: statsHoras, isLoading: isLoadingHoras } = useQuery({
    queryKey: ['bot-stats-horas', diasParam],
    queryFn: async () => (await api.get(`/bot/estadisticas/horas?dias=${diasParam}`)).data as BotStatsHoras,
    refetchInterval: 60_000,
  })

  // Estadísticas por día de semana
  const { data: statsDiaSemana, isLoading: isLoadingDiaSemana } = useQuery({
    queryKey: ['bot-stats-dia-semana', diasParam],
    queryFn: async () => (await api.get(`/bot/estadisticas/dia-semana?dias=${diasParam}`)).data as BotStatsDiaSemana,
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

    const headers = ['Fecha', 'Conversaciones', 'Mensajes totales']
    const rows = stats.por_dia.map(d => [
      d.fecha,
      d.conversaciones.toString(),
      d.total_mensajes.toString()
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
              {/* Gráfico: Conversaciones por día */}
              <div className="space-y-3">
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                  {/* Líneas de guía y barras */}
                  <div className="relative" style={{ height: '260px' }}>
                    {/* Grid horizontal */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-full border-t border-stone-200/60" />
                      ))}
                    </div>

                    {/* Barras - responsive inteligente */}
                    <div className="absolute inset-0 flex items-end pb-8">
                      {/* Scroll wrapper solo para móvil */}
                      <div className="w-full overflow-x-auto overflow-y-hidden scrollbar-thin sm:overflow-visible">
                        <div className="flex items-end justify-between gap-1 px-1 min-w-full sm:min-w-0">
                          {stats.por_dia.map((dia, idx) => {
                            const maxVal = Math.max(...stats.por_dia.map(d => d.conversaciones), 1)
                            const alturaPx = (dia.conversaciones / maxVal) * 210
                            const esHoy = idx === stats.por_dia.length - 1

                            return (
                              <div
                                key={dia.fecha}
                                className="flex flex-col items-center justify-end group relative"
                                style={{ flex: '1 1 0%', minWidth: '18px', maxWidth: '60px' }}
                              >
                                {/* Tooltip */}
                                <div className="relative mb-1.5">
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-stone-800 text-white text-[10px] font-medium px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                    <div className="font-bold text-emerald-400">{dia.conversaciones}</div>
                                    <div className="text-[9px] text-stone-300">{fmtFechaStats(dia.fecha)}</div>
                                  </div>
                                  <div className={`text-center font-bold text-xs ${esHoy ? 'text-brand' : 'text-stone-600'}`}>
                                    {dia.conversaciones}
                                  </div>
                                </div>

                                {/* Barra */}
                                <div
                                  className={`w-full rounded-t-md transition-all duration-200 ${
                                    esHoy
                                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/20'
                                      : 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500'
                                  } ${dia.conversaciones === 0 ? 'opacity-15' : ''}`}
                                  style={{ height: `${Math.max(alturaPx, dia.conversaciones > 0 ? 6 : 2)}px` }}
                                />

                                {/* Etiqueta día */}
                                <div className={`text-[10px] mt-1.5 font-medium text-center leading-none ${esHoy ? 'text-brand' : 'text-stone-500'}`}>
                                  {fmtDia(dia.fecha)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meses */}
                  <div className="flex border-t border-stone-200 mt-1 overflow-x-auto scrollbar-thin">
                    <div className="flex w-full justify-between">
                      {(() => {
                        const gruposPorMes: { [key: string ]: { dias: typeof stats.por_dia, count: number } } = {}
                        stats.por_dia.forEach((dia) => {
                          const mes = new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
                          if (!gruposPorMes[mes]) gruposPorMes[mes] = { dias: [], count: 0 }
                          gruposPorMes[mes].dias.push(dia)
                          gruposPorMes[mes].count++
                        })
                        const totalMeses = Object.keys(gruposPorMes).length
                        return Object.entries(gruposPorMes).map(([mes, grupo]) => (
                          <div key={mes} className="text-[9px] font-semibold text-stone-500 uppercase bg-stone-50 px-2 py-1 border-r border-stone-200 text-center shrink-0" style={{ flex: `${grupo.count} 1 0%` }}>
                            {mes}
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico por horas del día */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-brand" size={18} />
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Conversaciones por hora del día</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Últimos {statsHoras?.periodo_dias || 30} días • Hora pico: {statsHoras?.hora_pico ? `${statsHoras.hora_pico.hora}:00 (${statsHoras.hora_pico.total_mensajes} mensajes)` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {isLoadingHoras ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : statsHoras ? (
                <div className="space-y-3">
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    {/* Grid y barras */}
                    <div className="relative" style={{ height: '180px' }}>
                      {/* Grid horizontal */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="w-full border-t border-stone-200/60" />
                        ))}
                      </div>

                      {/* Barras - distribuidas equitativamente */}
                      <div className="absolute inset-0 flex items-end justify-between pb-6 px-1">
                        {statsHoras.por_hora.map((hora) => {
                          const maxMensajes = Math.max(...statsHoras.por_hora.map(h => h.total_mensajes), 1)
                          const alturaPx = (hora.total_mensajes / maxMensajes) * 140
                          const esHoraPico = statsHoras.hora_pico?.hora === hora.hora

                          return (
                            <div
                              key={hora.hora}
                              className="flex flex-col items-center justify-end group relative"
                              style={{ flex: '1 1 0%', minWidth: '12px', maxWidth: '45px' }}
                            >
                              <div className="relative mb-1">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-stone-800 text-white text-[9px] font-medium px-1.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                                  {hora.hora}:00 • {hora.total_mensajes}
                                </div>
                                <div className={`text-[9px] font-bold text-center ${esHoraPico ? 'text-brand' : 'text-stone-500'}`}>
                                  {hora.total_mensajes > 0 ? hora.total_mensajes : ''}
                                </div>
                              </div>
                              <div
                                className={`w-full rounded-t transition-all duration-200 ${
                                  esHoraPico
                                    ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-md shadow-orange-500/20'
                                    : 'bg-gradient-to-t from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500'
                                } ${hora.total_mensajes === 0 ? 'opacity-10' : ''}`}
                                style={{ height: `${Math.max(alturaPx, hora.total_mensajes > 0 ? 4 : 1)}px` }}
                              />
                              <div className={`text-[8px] mt-1 text-center leading-none ${esHoraPico ? 'text-brand font-bold' : 'text-stone-400'}`}>
                                {parseInt(hora.hora)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Leyenda compacta */}
                  <div className="flex items-center justify-center gap-3 text-[10px] text-stone-500 pt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-purple-500 to-purple-400" />
                      <span>Normal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-orange-500 to-orange-400" />
                      <span>Pico</span>
                    </div>
                    <span className="text-stone-300">|</span>
                    <span>{statsHoras.total_mensajes} msgs</span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-stone-400 text-sm py-6">Sin datos de horas</p>
              )}
            </div>
          </div>

          {/* Gráfico por día de la semana */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-brand" size={18} />
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Conversaciones por día de la semana</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Últimos {statsDiaSemana?.periodo_dias || 30} días • Más activo: {statsDiaSemana?.dia_mas_activo?.dia_semana || 'N/A'} ({statsDiaSemana?.dia_mas_activo?.conversaciones || 0})
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {isLoadingDiaSemana ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : statsDiaSemana ? (
                <div className="space-y-3">
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    {/* Grid y barras */}
                    <div className="relative" style={{ height: '180px' }}>
                      {/* Grid horizontal */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="w-full border-t border-stone-200/60" />
                        ))}
                      </div>

                      {/* Barras - distribuidas equitativamente */}
                      <div className="absolute inset-0 flex items-end justify-between pb-7 px-2">
                        {statsDiaSemana.por_dia_semana.map((dia) => {
                          const maxConversaciones = Math.max(...statsDiaSemana.por_dia_semana.map(d => d.conversaciones), 1)
                          const alturaPx = (dia.conversaciones / maxConversaciones) * 135
                          const esMasActivo = statsDiaSemana.dia_mas_activo?.dia_semana === dia.dia_semana

                          return (
                            <div
                              key={dia.dia_semana}
                              className="flex flex-col items-center justify-end group relative"
                              style={{ flex: '1 1 0%', minWidth: '35px', maxWidth: '80px' }}
                            >
                              <div className="relative mb-1.5">
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-stone-800 text-white text-[10px] font-medium px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg pointer-events-none">
                                  <div className="font-bold text-emerald-400">{dia.conversaciones}</div>
                                  <div className="text-[9px] text-stone-300">{dia.total_mensajes} msgs</div>
                                </div>
                                <div className={`text-sm sm:text-base font-bold text-center ${esMasActivo ? 'text-brand' : 'text-stone-600'}`}>
                                  {dia.conversaciones}
                                </div>
                              </div>
                              <div
                                className={`rounded-t-lg transition-all duration-200 ${
                                  esMasActivo
                                    ? 'bg-gradient-to-t from-brand to-brand-light shadow-md shadow-brand/20'
                                    : 'bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500'
                                } ${dia.conversaciones === 0 ? 'opacity-15' : ''}`}
                                style={{ height: `${Math.max(alturaPx, dia.conversaciones > 0 ? 8 : 2)}px`, width: '100%', maxWidth: '55px' }}
                              />
                              <div className={`text-[10px] sm:text-xs font-semibold mt-1.5 text-center leading-tight ${esMasActivo ? 'text-brand' : 'text-stone-500'}`}>
                                {dia.dia_semana.charAt(0).toUpperCase() + dia.dia_semana.slice(1, 3)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Leyenda compacta */}
                  <div className="flex items-center justify-center gap-3 text-[10px] text-stone-500 pt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-indigo-500 to-indigo-400" />
                      <span>Normal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded bg-gradient-to-t from-brand to-brand-light" />
                      <span>Popular</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-stone-400 text-sm py-6">Sin datos de día de semana</p>
              )}
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
