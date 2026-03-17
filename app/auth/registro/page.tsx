'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { AuthResponse } from '@/types'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
  aceptaTratamientoDatos: z.boolean().refine((v) => v, 'Debes aceptar el tratamiento de datos'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegistroPage() {
  const { setAuth } = useAuthStore()
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const registroMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/auth/registro', {
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        provider: 'LOCAL',
        aceptaTratamientoDatos: true,
      })
      return data.email
    },
    onSuccess: (email) => {
      setEmail(email)
      setStep('verify')
      toast.success('Te enviamos un código de verificación')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<AuthResponse>('/auth/verificar-email', { email, codigo })
      return res.data
    },
    onSuccess: (data) => {
      setAuth(data)
      toast.success('¡Cuenta creada! Bienvenido a Glamperos')
      router.push('/')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const reenviaMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/reenviar-verificacion', { email })
    },
    onSuccess: () => toast.success('Código reenviado'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/google`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold">
              <span className="text-emerald-600">Glamp</span>
              <span className="text-stone-800">eros</span>
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 mt-3">Crea tu cuenta</h1>
          <p className="text-stone-400 text-sm mt-1">Gratis y sin compromisos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {step === 'form' ? (
            <>
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-stone-300 rounded-xl py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors mb-6"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.638-.057-1.252-.164-1.84H9v3.48h4.844a4.14 4.14 0 01-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Registrarse con Google
              </button>

              <div className="relative mb-6">
                <hr className="border-stone-200" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-stone-400">
                  o con email
                </span>
              </div>

              <form
                onSubmit={handleSubmit((d) => registroMutation.mutate(d))}
                className="space-y-4"
              >
                <Input
                  label="Nombre completo"
                  placeholder="María García"
                  error={errors.nombre?.message}
                  {...register('nombre')}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="maria@ejemplo.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" {...register('aceptaTratamientoDatos')} className="mt-0.5" />
                  <span className="text-xs text-stone-500">
                    Acepto el{' '}
                    <Link href="/privacidad" className="text-emerald-600 hover:underline">
                      tratamiento de datos personales
                    </Link>{' '}
                    según la política de privacidad de Glamperos.
                  </span>
                </label>
                {errors.aceptaTratamientoDatos && (
                  <p className="text-xs text-red-500">{errors.aceptaTratamientoDatos.message}</p>
                )}

                <Button type="submit" fullWidth size="lg" loading={registroMutation.isPending}>
                  Crear cuenta
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-5xl mb-3">📧</p>
                <h2 className="font-semibold text-stone-800">Verifica tu email</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Enviamos un código a <strong>{email}</strong>
                </p>
              </div>
              <Input
                label="Código de 6 dígitos"
                placeholder="123456"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <Button
                fullWidth
                onClick={() => verifyMutation.mutate()}
                loading={verifyMutation.isPending}
                disabled={codigo.length !== 6}
              >
                Verificar y entrar
              </Button>
              <button
                onClick={() => reenviaMutation.mutate()}
                className="w-full text-sm text-stone-400 hover:text-stone-600"
              >
                Reenviar código
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-emerald-600 font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
