'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useMe } from '@/hooks/useAuth'
import { toTitleCase } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useRouter } from 'next/navigation'

const INDICATIVOS = [
  { code: '+57',  label: '+57 🇨🇴 Colombia' },
  { code: '+1',   label: '+1 🇺🇸 EE.UU.' },
  { code: '+52',  label: '+52 🇲🇽 México' },
  { code: '+54',  label: '+54 🇦🇷 Argentina' },
  { code: '+56',  label: '+56 🇨🇱 Chile' },
  { code: '+51',  label: '+51 🇵🇪 Perú' },
  { code: '+593', label: '+593 🇪🇨 Ecuador' },
  { code: '+58',  label: '+58 🇻🇪 Venezuela' },
  { code: '+55',  label: '+55 🇧🇷 Brasil' },
  { code: '+507', label: '+507 🇵🇦 Panamá' },
  { code: '+591', label: '+591 🇧🇴 Bolivia' },
  { code: '+34',  label: '+34 🇪🇸 España' },
]

function parseTelefono(telefono: string) {
  const match = INDICATIVOS.find(({ code }) => telefono.startsWith(code))
  if (match) return { indicativo: match.code, numero: telefono.slice(match.code.length) }
  return { indicativo: '+57', numero: telefono.replace(/^\+/, '') }
}

interface PerfilForm {
  nombre: string
  indicativo: string
  telefonoNumero: string
}

interface PagosForm {
  // Documento — obligatorio
  tipoDocumento: string
  numeroDocumento: string
  nombreTitular: string
  // Medios digitales
  nequiNumero: string
  daviplataNumero: string
  // Cuenta bancaria
  banco: string
  numeroCuenta: string
  tipoCuenta: string
}

export default function PerfilPage() {
  const { isAuthenticated, user: authUser } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: usuario, isLoading } = useMe()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PerfilForm>({
    defaultValues: { indicativo: '+57' }
  })
  const { register: regPagos, handleSubmit: hsPagos, reset: resetPagos, formState: { errors: errorsPagos } } = useForm<PagosForm>()

  useEffect(() => {
    if (usuario) {
      const { indicativo, numero } = parseTelefono(usuario.telefono || '')
      reset({ nombre: usuario.nombre, indicativo, telefonoNumero: numero })
      resetPagos({
        tipoDocumento:    usuario.tipoDocumento    || '',
        numeroDocumento:  usuario.numeroDocumento  || '',
        nombreTitular:    usuario.nombreTitular    || '',
        nequiNumero:      usuario.nequiNumero      || '',
        daviplataNumero:  usuario.daviplataNumero  || '',
        banco:            usuario.banco            || '',
        numeroCuenta:     usuario.numeroCuenta     || '',
        tipoCuenta:       usuario.tipoCuenta       || '',
      })
    }
  }, [usuario, reset, resetPagos])

  const updatePerfil = useMutation({
    mutationFn: async (data: PerfilForm) => {
      const payload = {
        nombre: toTitleCase(data.nombre),
        telefono: data.telefonoNumero ? `${data.indicativo}${data.telefonoNumero.replace(/\s/g, '')}` : '',
      }
      const res = await api.put('/usuarios/me', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Perfil actualizado')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const updatePagos = useMutation({
    mutationFn: async (data: PagosForm) => {
      if (!usuario?._id) throw new Error('Sin ID')
      const res = await api.put(`/usuarios/${usuario._id}/banco`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Medios de pago actualizados')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null
  if (isLoading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Mi perfil</h1>
        <p className="text-stone-400 text-sm mt-1 truncate">{authUser?.rol} · {usuario?.email}</p>
      </div>

      {/* Info personal */}
      <form
        onSubmit={handleSubmit((d) => updatePerfil.mutate(d))}
        className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-4"
      >
        <h2 className="font-semibold text-stone-800">Información personal</h2>
        <Input label="Nombre completo" error={errors.nombre?.message} {...register('nombre', { required: true })} />

        <div>
          <label className="text-sm font-medium text-stone-700 block mb-1">Teléfono</label>
          <div className="flex gap-2">
            <select
              {...register('indicativo')}
              className="rounded-xl border border-stone-300 px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shrink-0 max-w-[140px] sm:max-w-none"
            >
              {INDICATIVOS.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="3001234567"
              className="flex-1 min-w-0 rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              {...register('telefonoNumero')}
            />
          </div>
        </div>

        <Button type="submit" loading={updatePerfil.isPending} fullWidth>
          Guardar cambios
        </Button>
      </form>

      {/* Medios de pago (solo anfitriones) */}
      {(usuario?.rol === 'anfitrion' || usuario?.rol === 'admin') && (
        <form
          onSubmit={hsPagos((d) => updatePagos.mutate(d))}
          className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 space-y-5"
        >
          <div>
            <h2 className="font-semibold text-stone-800">Medios de pago</h2>
            <p className="text-sm text-stone-400 mt-0.5">Cómo quieres recibir los pagos de Glamperos</p>
          </div>

          {/* Documento — obligatorio */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Documento de identidad *</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Tipo *</label>
                <select
                  {...regPagos('tipoDocumento', { required: 'Obligatorio' })}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Seleccionar</option>
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PP">Pasaporte</option>
                </select>
                {errorsPagos.tipoDocumento && (
                  <p className="text-xs text-red-500 mt-1">{errorsPagos.tipoDocumento.message}</p>
                )}
              </div>
              <Input
                label="Número *"
                placeholder="1234567890"
                error={errorsPagos.numeroDocumento?.message}
                {...regPagos('numeroDocumento', { required: 'Obligatorio' })}
              />
              <Input
                label="Nombre del titular *"
                placeholder="Como aparece en el documento"
                error={errorsPagos.nombreTitular?.message}
                {...regPagos('nombreTitular', { required: 'Obligatorio' })}
              />
            </div>
          </div>

          {/* Medios digitales */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Billeteras digitales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-200">
                <div className="w-9 h-9 rounded-lg bg-[#FF0080]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#FF0080] font-bold text-xs">N</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    label="Nequi — número de celular"
                    placeholder="3001234567"
                    {...regPagos('nequiNumero')}
                  />
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-200">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-500 font-bold text-xs">D</span>
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    label="Daviplata — número de celular"
                    placeholder="3001234567"
                    {...regPagos('daviplataNumero')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cuenta bancaria */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cuenta bancaria</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Banco" placeholder="Bancolombia, Davivienda..." {...regPagos('banco')} />
              <Input label="Número de cuenta" {...regPagos('numeroCuenta')} />
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Tipo de cuenta</label>
                <select
                  {...regPagos('tipoCuenta')}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Seleccionar</option>
                  <option value="Ahorros">Ahorros</option>
                  <option value="Corriente">Corriente</option>
                </select>
              </div>
            </div>
          </div>

          <Button type="submit" loading={updatePagos.isPending} fullWidth>
            Guardar medios de pago
          </Button>
        </form>
      )}

      {/* Verificación */}
      {usuario && !usuario.emailVerificado && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
          <p className="font-medium text-amber-800">Email no verificado</p>
          <p className="text-sm text-amber-600 mt-1">
            Verifica tu email para acceder a todas las funcionalidades.
          </p>
        </div>
      )}
    </div>
  )
}
