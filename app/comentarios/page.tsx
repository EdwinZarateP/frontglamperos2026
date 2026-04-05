'use client'

import { useState } from 'react'
import { MessageSquareHeart, Send, CheckCircle2 } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'

const TIPOS = [
  { value: 'felicitacion', label: '🌟 Felicitación' },
  { value: 'sugerencia',   label: '💡 Sugerencia' },
  { value: 'queja',        label: '⚠️ Queja' },
  { value: 'otro',         label: '💬 Otro' },
]

export default function ComentariosPage() {
  const [form, setForm] = useState({ nombre: '', email: '', tipo: 'felicitacion', mensaje: '' })
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.mensaje.trim()) { setError('El mensaje no puede estar vacío.'); return }
    setError('')
    setLoading(true)
    try {
      await api.post('/comentarios/', {
        nombre:  form.nombre.trim() || undefined,
        email:   form.email.trim()  || undefined,
        tipo:    form.tipo,
        mensaje: form.mensaje.trim(),
      })
      setEnviado(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-10 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
          <h1 className="text-xl font-bold text-stone-900">¡Gracias por tu opinión!</h1>
          <p className="text-stone-500 text-sm">Tu mensaje fue recibido. Nos ayuda a mejorar la plataforma para todos 🙏</p>
          <button
            onClick={() => { setEnviado(false); setForm({ nombre: '', email: '', tipo: 'felicitacion', mensaje: '' }) }}
            className="mt-2 text-sm text-brand font-medium hover:underline"
          >
            Enviar otro comentario
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-16 px-4">
      <div className="max-w-lg mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-emerald-50 p-3 rounded-full">
              <MessageSquareHeart className="text-brand" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Deja tu opinión</h1>
          <p className="text-stone-500 text-sm">
            Tu experiencia nos importa. Cuéntanos qué mejorar, qué te gustó o cualquier comentario sobre Glamperos.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-left
                  ${form.tipo === t.value
                    ? 'bg-emerald-50 border-brand text-brand'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nombre <span className="text-stone-400 font-normal">(opcional)</span></label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Correo electrónico <span className="text-stone-400 font-normal">(opcional)</span></label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Tu mensaje <span className="text-red-400">*</span></label>
            <textarea
              name="mensaje"
              value={form.mensaje}
              onChange={handleChange}
              rows={5}
              placeholder="Cuéntanos tu experiencia, sugerencia o queja..."
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-xl py-3 text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-60"
          >
            <Send size={16} />
            {loading ? 'Enviando...' : 'Enviar comentario'}
          </button>
        </form>
      </div>
    </div>
  )
}
