// ─── Usuarios ───────────────────────────────────────────────────────────────
export type Rol = 'usuario' | 'anfitrion' | 'admin'
export type Provider = 'LOCAL' | 'GOOGLE'

export interface Usuario {
  _id: string
  nombre: string
  email: string
  telefono?: string
  provider: Provider
  rol: Rol
  foto?: string
  banco?: string
  numeroCuenta?: string
  tipoCuenta?: string
  tipoDocumento?: string
  numeroDocumento?: string
  nombreTitular?: string
  nequiNumero?: string
  daviplataNumero?: string
  emailVerificado: boolean
  fechaRegistro: string
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthResponse {
  access_token: string
  token_type: string
  user: { id: string; nombre: string; rol: Rol; foto?: string }
}

// ─── Extras ─────────────────────────────────────────────────────────────────
export type UnidadExtra = 'por_persona' | 'por_noche' | 'fijo'

export interface ServicioExtra {
  key: string
  nombre: string
  descripcion?: string
  precio: number
  precioPublico: number
  unidad: UnidadExtra
  disponible: boolean
}

// ─── Tarifas ─────────────────────────────────────────────────────────────────
export interface TarifasSemana {
  lunes: number
  martes: number
  miercoles: number
  jueves: number
  viernes: number
  sabado: number
  domingo: number
}

// ─── Glamping ────────────────────────────────────────────────────────────────
export interface Glamping {
  _id: string
  habilitado: boolean
  borrador: boolean
  nombrePropiedad?: string
  nombreGlamping: string
  tipoGlamping: string
  descripcionGlamping: string
  ciudadDepartamento: string
  direccion: string
  ubicacion: { lat: number; lng: number }
  precioNoche: number
  tarifasNoche?: Partial<TarifasSemana>
  tarifasPasadia?: Partial<TarifasSemana>
  cantidadHuespedes: number
  cantidadHuespedesAdicionales: number
  minimoNoches: number
  aceptaMascotas: boolean
  checkInNoche: string
  checkOutNoche: string
  permitePasadia: boolean
  pasadiaHorarioInicio?: string
  pasadiaHorarioFin?: string
  descripcionPasadia?: string
  diasCancelacion?: number | null
  amenidades: string[]
  extras: ServicioExtra[]
  imagenes: string[]
  videoYoutube?: string
  politicasCasa?: string
  rntUrl?: string
  propietarioId: string
  calificacion: number
  totalCalificaciones: number
  precioMascotas?: number
  precioPersonaAdicional?: number
  createdAt: string
  updatedAt: string
}

// ─── Home Card ───────────────────────────────────────────────────────────────
export interface GlampingCard {
  id: string
  nombreSeo: string
  tipo: string
  ciudadDepartamento: string
  precioSabado: number
  precioMiercoles: number
  imagenes: string[]
  amenidades: string[]
  calificacion: number
  totalCalificaciones: number
  distanciaKm?: number
  esFavorito: boolean
  aceptaMascotas?: boolean
  minimoNoches?: number
}

export interface HomeResponse {
  total: number
  page: number
  limit: number
  data: GlampingCard[]
}

// ─── Cotización ──────────────────────────────────────────────────────────────
export interface DesgloseCotizacionNoche {
  fecha: string
  diaSemana: string
  precioNocheAnfitrion: number
  precioNoche: number
}

export interface Cotizacion {
  glampingId: string
  nombreGlamping: string
  fechaInicio: string
  fechaFin: string
  noches: number
  huespedes: number
  huespedesAdicionales: number
  desgloseNoches: DesgloseCotizacionNoche[]
  subtotalAlojamiento: number
  subtotalExtras: number
  comisionTotal: number
  total: number
}

// ─── Reserva ─────────────────────────────────────────────────────────────────
export type EstadoReserva =
  | 'PENDIENTE_APROBACION'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'COMPLETADA'
  | 'PAGO_RECIBIDO'

export type TipoReserva = 'NOCHES' | 'PASADIA'

export interface Acompanante {
  nombreCompleto: string
  telefono: string
}

export interface Reserva {
  _id: string
  glampingId: string
  usuarioId: string
  fuente: string
  tipo: TipoReserva
  estado: EstadoReserva
  fechaInicio?: string
  fechaFin?: string
  fecha?: string
  huespedes: number
  huespedesAdicionales: number
  extrasSeleccionados: string[]
  nombreTitular: string
  cedulaTitular: string
  celularTitular: string
  emailTitular: string
  acompanantes: Acompanante[]
  notasEspeciales: string
  precioBase: number
  precioExtras: number
  precioTotal: number
  montoPagado: number
  saldoPendiente: number
  metodoPago?: 'transferencia' | 'wompi'
  valorUsoWompi?: number
  comision: number
  precioAnfitrion: number
  montoAnfitrion: number
  comisionCobrada: number
  transferirAnfitrion: number
  comprobantePago?: string
  createdAt: string
  updatedAt: string
  // Populated
  glamping?: Glamping
}

// ─── Pagos Wompi ─────────────────────────────────────────────────────────────
export interface WompiDesglose {
  precioTotalReserva: number
  porcentajeElegido: number
  montoReserva: number
  recargo_wompi_5pct: number
  totalACobrar: number
  saldoPendienteTrasPago: number
}

export interface WompiIniciarResponse {
  reservaId: string
  desglose: WompiDesglose
  acceptance_token: string
  acceptance_token_personal_auth: string
  referencia: string
  amount_in_cents: number
  currency: string
  customer_email: string
  firma_integridad: string
  public_key: string
  wompi_script_url: string
  redirect_url: string
  ambiente: string
}

// ─── Calificaciones ──────────────────────────────────────────────────────────
export interface Calificacion {
  calificacion: number
  comentario: string
  createdAt: string
  nombreTitular?: string
}

export interface CalificacionesResponse {
  calificaciones: Calificacion[]
  total: number
}

// ─── Unidades ────────────────────────────────────────────────────────────────
export interface Unidad {
  _id: string
  glampingId: string
  nombre: string
  habilitada: boolean
  urlIcal?: string
}

// ─── Catálogos ───────────────────────────────────────────────────────────────
export interface Amenidad {
  key: string
  nombre: string
  icono?: string
}

export interface TipoGlamping {
  key: string
  nombre: string
  icono?: string
}

// ─── Filtros Home ────────────────────────────────────────────────────────────
export interface FiltrosHome {
  page?: number
  limit?: number
  tipo?: string
  ciudad?: string
  precio_min?: number
  precio_max?: number
  amenidades?: string
  extras?: string
  huespedes?: number
  fecha_inicio?: string
  fecha_fin?: string
  lat?: number
  lng?: number
  radio_km?: number
  order_by?: 'precio_asc' | 'precio_desc' | 'distancia' | 'calificacion'
  acepta_mascotas?: boolean
}

// ─── Soporte ─────────────────────────────────────────────────────────────────
export interface TicketSoporte {
  _id: string
  nombre: string
  email: string
  mensaje: string
  tipo: string
  estado: string
  createdAt: string
}

// ─── Comentarios Plataforma ───────────────────────────────────────────────────
export interface ComentarioPlataforma {
  _id: string
  nombre: string
  email: string
  tipo: 'sugerencia' | 'queja' | 'felicitacion' | 'otro'
  mensaje: string
  estado: 'pendiente' | 'leido'
  createdAt: string
}

// ─── Estadísticas ────────────────────────────────────────────────────────────
export interface Estadisticas {
  ingresosMes: number
  reservasMes: number
  ocupacion: number
  calificacionPromedio: number
  reservasPorEstado: Record<string, number>
}
