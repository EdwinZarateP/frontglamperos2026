'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Pencil, X } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Usuario {
  id?: string
  _id?: string
  nombre: string
  email: string
  rol: string
  emailVerificado: boolean
  telefono?: string
  foto?: string
  // pago
  tipoDocumento?: string
  numeroDocumento?: string
  nombreTitular?: string
  banco?: string
  numeroCuenta?: string
  tipoCuenta?: string
}

interface Glamping {
  id?: string
  _id?: string
  nombreGlamping: string
}

const ROL_COLOR: Record<string, string> = {
  admin:     'bg-red-100 text-red-700',
  anfitrion: 'bg-emerald-100 text-brand-light',
  usuario:   'bg-stone-100 text-stone-600',
}

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
  { code: '+34',  label: '+34 🇪🇸 España' },
]

function parseTelefono(telefono: string) {
  const match = INDICATIVOS.find(({ code }) => telefono.startsWith(code))
  if (match) return { indicativo: match.code, numero: telefono.slice(match.code.length) }
  return { indicativo: '+57', numero: telefono.replace(/^\+\d+/, '') }
}

const BANCOS = [
  'Bancolombia', 'Davivienda', 'Banco de Bogotá', 'BBVA', 'Banco Popular',
  'Banco de Occidente', 'Banco Agrario', 'Banco Caja Social', 'Banco Falabella',
  'Banco Pichincha', 'Scotiabank Colpatria', 'Itaú', 'Banco Finandina',
  'Nequi', 'Daviplata', 'Movii', 'Rappipay',
]

const field = (label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
  <div>
    <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
    />
  </div>
)

const sel = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
  <div>
    <label className="text-xs font-medium text-stone-500 block mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
    >
      <option value="">Seleccionar</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

export default function AdminUsuariosPage() {
  const { user: adminUser } = useAuthStore()
  const adminId = adminUser?.id ?? (adminUser as any)?._id

  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState({
    nombre: '', indicativo: '+57', telefonoNumero: '', rol: '', glampingId: '',
    tipoDocumento: '', numeroDocumento: '', nombreTitular: '',
    banco: '', numeroCuenta: '', tipoCuenta: '',
  })

  const { data: usuarios = [], isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ['admin-usuarios'],
    queryFn: async () => (await api.get('/usuarios/todos/lista')).data,
  })

  const { data: misGlampings = [] } = useQuery<Glamping[]>({
    queryKey: ['admin-mis-glampings'],
    queryFn: async () => (await api.get(`/glampings/por_propietario/${adminId}`)).data,
    enabled: !!adminId,
  })

  const uid = (u: Usuario) => u.id ?? u._id ?? ''

  const abrirModal = (u: Usuario) => {
    setEditando(u)
    const { indicativo, numero } = parseTelefono(u.telefono ?? '')
    setForm({
      nombre:          u.nombre ?? '',
      indicativo,
      telefonoNumero:  numero,
      rol:             u.rol,
      glampingId:      '',
      tipoDocumento:   u.tipoDocumento   ?? '',
      numeroDocumento: u.numeroDocumento ?? '',
      nombreTitular:   u.nombreTitular   ?? '',
      banco:           u.banco           ?? '',
      numeroCuenta:    u.numeroCuenta    ?? '',
      tipoCuenta:      u.tipoCuenta      ?? '',
    })
  }

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }))

  const guardar = useMutation({
    mutationFn: async () => {
      if (!editando) return
      const id = uid(editando)
      const ps: Promise<any>[] = []

      const telefonoCompleto = form.telefonoNumero
        ? `${form.indicativo}${form.telefonoNumero.replace(/\s/g, '')}`
        : ''
      if (form.nombre !== editando.nombre || telefonoCompleto !== (editando.telefono ?? '')) {
        ps.push(api.put(`/usuarios/${id}`, { nombre: form.nombre, telefono: telefonoCompleto || null }))
      }
      if (form.rol !== editando.rol) {
        ps.push(api.put(`/usuarios/${id}/rol`, { rol: form.rol }))
      }
      if (form.glampingId) {
        ps.push(api.put(`/glampings/${form.glampingId}/propietario`, null, {
          params: { nuevo_propietario_id: id },
        }))
      }
      // Medios de pago
      const pagoFields = ['tipoDocumento','numeroDocumento','nombreTitular','banco','numeroCuenta','tipoCuenta'] as const
      const pagoChanged = pagoFields.some((k) => form[k] !== (editando[k] ?? ''))
      if (pagoChanged) {
        const payload: Record<string, string> = {}
        pagoFields.forEach((k) => { if (form[k]) payload[k] = form[k] })
        ps.push(api.put(`/usuarios/${id}/banco`, payload))
      }

      await Promise.all(ps)
    },
    onSuccess: () => {
      toast.success('Usuario actualizado')
      setEditando(null)
      refetch()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const filtrados = usuarios.filter((u) =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const esAnfitrion = editando?.rol === 'anfitrion' || editando?.rol === 'admin' || form.rol === 'anfitrion' || form.rol === 'admin'

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-stone-900">Usuarios</h1>
        <span className="text-sm text-stone-400">{usuarios.length} registrados</span>
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o email..."
        className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400">No se encontraron usuarios.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <ul className="divide-y divide-stone-100">
            {filtrados.map((u, i) => (
              <li key={uid(u) || i} className="flex items-center gap-3 px-5 py-4">
                {u.foto ? (
                  <img src={u.foto} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-sm shrink-0">
                    {u.nombre?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{u.nombre}</p>
                  <p className="text-xs text-stone-400 truncate">{u.email}</p>
                </div>
                {!u.emailVerificado && (
                  <span className="shrink-0 text-[10px] bg-amber-100 text-amber-600 font-semibold px-2 py-0.5 rounded-full hidden sm:inline">
                    Sin verificar
                  </span>
                )}
                <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${ROL_COLOR[u.rol] ?? 'bg-stone-100 text-stone-600'}`}>
                  {u.rol}
                </span>
                <button
                  onClick={() => abrirModal(u)}
                  className="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-brand hover:bg-emerald-50 transition-colors"
                >
                  <Pencil size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditando(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900">Editar usuario</h3>
              <button onClick={() => setEditando(null)} className="p-1 rounded-lg hover:bg-stone-100"><X size={18} /></button>
            </div>

            <p className="text-xs text-stone-400 -mt-2">{editando.email}</p>

            {/* Info básica */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Datos personales</p>
              {field('Nombre', form.nombre, set('nombre'))}
              <div>
                <label className="text-xs font-medium text-stone-500 block mb-1">Teléfono</label>
                <div className="flex gap-2">
                  <select
                    value={form.indicativo}
                    onChange={(e) => setForm((f) => ({ ...f, indicativo: e.target.value }))}
                    className="rounded-xl border border-stone-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white shrink-0"
                  >
                    {INDICATIVOS.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={form.telefonoNumero}
                    onChange={(e) => setForm((f) => ({ ...f, telefonoNumero: e.target.value }))}
                    placeholder="3001234567"
                    className="flex-1 min-w-0 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
              {sel('Rol', form.rol, set('rol'), [
                { value: 'usuario', label: 'Usuario' },
                { value: 'anfitrion', label: 'Anfitrión' },
                { value: 'admin', label: 'Admin' },
              ])}
            </div>

            {/* Medios de pago — solo anfitrión/admin */}
            {esAnfitrion && (
              <div className="space-y-3 pt-4 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Medios de pago</p>
                <div className="grid grid-cols-2 gap-3">
                  {sel('Tipo documento', form.tipoDocumento, set('tipoDocumento'), [
                    { value: 'CC', label: 'Cédula de ciudadanía' },
                    { value: 'NIT', label: 'NIT' },
                    { value: 'CE', label: 'Cédula de extranjería' },
                    { value: 'PP', label: 'Pasaporte' },
                  ])}
                  {field('Número documento', form.numeroDocumento, set('numeroDocumento'), '1234567890')}
                </div>
                {field('Nombre del titular', form.nombreTitular, set('nombreTitular'), 'Como aparece en el documento')}
                {sel('Banco o billetera', form.banco, set('banco'),
                  BANCOS.map((b) => ({ value: b, label: b }))
                )}
                <div className="grid grid-cols-2 gap-3">
                  {field('Número de cuenta', form.numeroCuenta, set('numeroCuenta'), '0000000000')}
                  {sel('Tipo de cuenta', form.tipoCuenta, set('tipoCuenta'), [
                    { value: 'Ahorros', label: 'Ahorros' },
                    { value: 'Corriente', label: 'Corriente' },
                  ])}
                </div>
              </div>
            )}

            {/* Asignar glamping */}
            {misGlampings.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Asignar glamping</p>
                {sel('Glamping', form.glampingId, set('glampingId'),
                  misGlampings.map((g, gi) => ({ value: g.id ?? g._id ?? String(gi), label: g.nombreGlamping }))
                )}
                <p className="text-[11px] text-stone-400">Al asignar, el usuario se convierte en anfitrión automáticamente.</p>
              </div>
            )}

            <Button onClick={() => guardar.mutate()} loading={guardar.isPending} fullWidth>
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
