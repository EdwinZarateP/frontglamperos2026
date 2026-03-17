'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import type { Rol } from '@/types'

export function CallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  // Datos del usuario recibidos por URL
  const [pendingAuth, setPendingAuth] = useState<{
    token: string; id: string; nombre: string; rol: Rol; foto?: string
  } | null>(null)

  const [aceptado, setAceptado] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const id = searchParams.get('id')
    const nombre = searchParams.get('nombre')
    const rol = searchParams.get('rol')
    const foto = searchParams.get('foto')
    const nuevo = searchParams.get('nuevo')

    if (!token || !id || !nombre) {
      toast.error('Error al iniciar sesión con Google')
      router.replace('/auth/login')
      return
    }

    const authData = {
      token,
      id,
      nombre,
      rol: (rol as Rol) || 'usuario',
      foto: foto || undefined,
    }

    if (nuevo === '1') {
      // Primer registro — mostrar modal de aceptación
      setPendingAuth(authData)
      setMostrarModal(true)
    } else {
      // Usuario existente — login directo
      setAuth({
        access_token: token,
        token_type: 'bearer',
        user: { id, nombre, rol: (rol as Rol) || 'usuario', foto: foto || undefined },
      })
      toast.success(`¡Bienvenido de nuevo, ${nombre.split(' ')[0]}!`)
      router.replace('/')
    }
  }, [searchParams]) // eslint-disable-line

  const handleAceptar = () => {
    if (!aceptado) {
      toast.error('Debes aceptar el tratamiento de datos para continuar')
      return
    }
    if (!pendingAuth) return

    setAuth({
      access_token: pendingAuth.token,
      token_type: 'bearer',
      user: {
        id: pendingAuth.id,
        nombre: pendingAuth.nombre,
        rol: pendingAuth.rol,
        foto: pendingAuth.foto,
      },
    })
    toast.success(`¡Bienvenido a Glamperos, ${pendingAuth.nombre.split(' ')[0]}!`)
    router.replace('/')
  }

  const handleRechazar = () => {
    toast.error('Debes aceptar las políticas para usar Glamperos')
    router.replace('/auth/login')
  }

  // Modal de aceptación para nuevos usuarios
  if (mostrarModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-6">
            <span className="text-2xl font-bold">
              <span className="text-emerald-600">Glamp</span>
              <span className="text-stone-800">eros</span>
            </span>
            <p className="text-stone-500 text-sm mt-1">Antes de continuar</p>
          </div>

          {/* Ícono */}
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🏕️</span>
            </div>
            <h1 className="text-lg font-bold text-stone-900">
              ¡Bienvenido, {pendingAuth?.nombre.split(' ')[0]}!
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Para completar tu registro necesitamos tu aceptación.
            </p>
          </div>

          {/* Resumen de términos */}
          <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-500 space-y-2 mb-5">
            <p>
              <strong className="text-stone-700">¿Qué datos recopilamos?</strong>{' '}
              Nombre, email y foto de perfil de tu cuenta de Google.
            </p>
            <p>
              <strong className="text-stone-700">¿Para qué los usamos?</strong>{' '}
              Gestión de tu cuenta, reservas, notificaciones y comunicaciones
              relacionadas con el servicio.
            </p>
            <p>
              <strong className="text-stone-700">¿Compartimos tus datos?</strong>{' '}
              Solo con los anfitriones de las reservas que realices, nunca con terceros
              para fines comerciales.
            </p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
              className="mt-0.5 accent-emerald-600 w-4 h-4 shrink-0"
            />
            <span className="text-sm text-stone-600 leading-relaxed">
              Acepto el{' '}
              <Link href="/privacidad" target="_blank" className="text-emerald-600 underline hover:text-emerald-700">
                tratamiento de mis datos personales
              </Link>{' '}
              según la política de privacidad de Glamperos, de conformidad con la Ley
              1581 de 2012.
            </span>
          </label>

          {/* Botones */}
          <div className="flex flex-col gap-3">
            <Button fullWidth onClick={handleAceptar} disabled={!aceptado}>
              Aceptar y continuar
            </Button>
            <button
              onClick={handleRechazar}
              className="text-sm text-stone-400 hover:text-stone-600 text-center py-1"
            >
              No acepto — cancelar registro
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading mientras procesa
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner className="py-4" />
        <p className="text-stone-500 mt-2">Iniciando sesión con Google...</p>
      </div>
    </div>
  )
}
