'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { AuthResponse } from '@/types'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { setAuth } = useAuthStore()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [needVerify, setNeedVerify] = useState(false)
  const [emailForVerify, setEmailForVerify] = useState('')
  const [verifyCode, setVerifyCode] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post<AuthResponse>('/auth/login', data)
      return res.data
    },
    onSuccess: (data) => {
      setAuth(data)
      toast.success(`¡Bienvenido, ${data.user.nombre.split(' ')[0]}!`)
      router.push('/')
    },
    onError: (err: unknown) => {
      const msg = getErrorMessage(err)
      if (msg.toLowerCase().includes('verif') || msg.toLowerCase().includes('email')) {
        setNeedVerify(true)
        toast.error('Debes verificar tu email antes de iniciar sesión')
      } else {
        toast.error(msg)
      }
    },
  })

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<AuthResponse>('/auth/verificar-email', {
        email: emailForVerify,
        codigo: verifyCode,
      })
      return res.data
    },
    onSuccess: (data) => {
      setAuth(data)
      toast.success('¡Email verificado! Bienvenido')
      router.push('/')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const reenviaMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/reenviar-verificacion', { email: emailForVerify })
    },
    onSuccess: () => toast.success('Código reenviado a tu correo'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const onSubmit = (data: FormData) => {
    setEmailForVerify(data.email)
    loginMutation.mutate(data)
  }

  const handleGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/google`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold">
              <span className="text-emerald-600">Glamp</span>
              <span className="text-stone-800">eros</span>
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-stone-800 mt-3">
            Bienvenido de vuelta
          </h1>
          <p className="text-stone-400 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {!needVerify ? (
            <>
              {/* Google OAuth */}
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
                Continuar con Google
              </button>

              <div className="relative mb-6">
                <hr className="border-stone-200" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-3 text-xs text-stone-400">
                  o con tu email
                </span>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="maria@ejemplo.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <div className="relative">
                  <Input
                    label="Contraseña"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-8 text-xs text-stone-400 hover:text-stone-600"
                  >
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                <div className="text-right">
                  <Link href="/auth/recuperar" className="text-xs text-emerald-600 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button type="submit" fullWidth size="lg" loading={loginMutation.isPending}>
                  Iniciar sesión
                </Button>
              </form>
            </>
          ) : (
            /* Verificación de email */
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-4xl mb-3">📧</p>
                <h2 className="font-semibold text-stone-800">Verifica tu email</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Te enviamos un código a <strong>{emailForVerify}</strong>
                </p>
              </div>
              <Input
                label="Código de verificación"
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
              />
              <Button
                fullWidth
                onClick={() => verifyMutation.mutate()}
                loading={verifyMutation.isPending}
                disabled={verifyCode.length !== 6}
              >
                Verificar
              </Button>
              <button
                onClick={() => reenviaMutation.mutate()}
                className="w-full text-sm text-stone-400 hover:text-stone-700"
              >
                Reenviar código
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/registro" className="text-emerald-600 font-medium hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
