import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, Phone, HelpCircle, Calendar, Shield, Home, UserPlus, ArrowRight, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Centro de Ayuda | Glamperos Colombia',
  description:
    'Encuentra respuestas a tus preguntas, contacta a nuestro equipo de soporte y descubre cómo reservar el glamping perfecto en Colombia.',
  alternates: { canonical: '/soporte' },
  openGraph: {
    title: 'Centro de Ayuda | Glamperos Colombia',
    description:
      '¿Necesitas ayuda? Encuentra respuestas, contacta a soporte y resuelve tus dudas sobre reservas, pagos y más en Glamperos.',
    type: 'website',
    images: [{ url: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Centro de Ayuda | Glamperos Colombia',
    description: '¿Necesitas ayuda? Encuentra respuestas, contacta a soporte y resuelve tus dudas.',
    images: ['https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'],
  },
}

const faqs = [
  {
    pregunta: '¿Cómo hago una reserva?',
    respuesta: 'Busca el glamping que te guste, selecciona las fechas y número de huéspedes, y haz clic en "Reservar". Completa tus datos y realiza el pago en línea seguro. Recibirás una confirmación por correo electrónico.',
    icon: Calendar,
  },
  {
    pregunta: '¿Cuál es la política de cancelación?',
    respuesta: 'Cada glamping tiene su propia política de cancelación definida por el anfitrión. Antes de reservar, revisa la sección de políticas en la ficha del glamping para conocer los términos específicos de reembolso y plazos de cancelación.',
    icon: Shield,
  },
  {
    pregunta: '¿Puedo llevar mascotas?',
    respuesta: 'Algunos glampings aceptan mascotas. Fíjate en el ícono de mascotas en la ficha del glamping o usa el filtro "Acepta mascotas" en la búsqueda. Se aplica un costo adicional por mascota.',
    icon: Home,
  },
  {
    pregunta: '¿Cómo puedo ser anfitrión en Glamperos?',
    respuesta: 'Regístrate en la plataforma y completa tu perfil. Luego crea tu glamping con fotos, descripción y tarifas. Nuestro equipo revisará tu publicación y, una vez aprobada, podrás recibir reservas.',
    icon: UserPlus,
  },
  {
    pregunta: '¿Métodos de pago aceptados?',
    respuesta: 'Aceptamos tarjetas de crédito y débito, PSE, y otros métodos electrónicos a través de nuestra plataforma de pagos segura Wompi. Todos los pagos son procesados de forma segura.',
    icon: Check,
  },
  {
    pregunta: '¿Confirmación inmediata?',
    respuesta: 'Sí, tu reserva se confirma automáticamente al completar el pago. Recibirás un correo con todos los detalles y el contacto del anfitrión.',
    icon: Check,
  },
]

export default function SoportePage() {
  return (
    <main className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png')] bg-cover bg-center opacity-25" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-brand/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Centro de ayuda
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            ¿En qué podemos <span className="text-emerald-400">ayudarte</span>?
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Encuentra respuestas rápidas, contacta a nuestro equipo y resuelve todas tus dudas sobre Glamperos.
          </p>
        </div>
      </section>

      {/* ── CANALES DE CONTACTO ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-stone-900 text-center mb-10">Contáctanos directamente</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Email */}
          <a
            href="mailto:soporte@glamperos.com"
            className="group bg-white rounded-2xl p-6 border border-stone-200 hover:border-brand hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
              <Mail size={24} className="text-brand group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Correo electrónico</h3>
            <p className="text-stone-500 text-sm mb-3">Te respondemos en menos de 24 horas</p>
            <p className="text-brand font-medium text-sm">soporte@glamperos.com</p>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/573218695196"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-6 border border-stone-200 hover:border-brand hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
              <MessageCircle size={24} className="text-brand group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">WhatsApp</h3>
            <p className="text-stone-500 text-sm mb-3">Atención inmediata en horario laboral</p>
            <p className="text-brand font-medium text-sm">+57 321 869 5196</p>
          </a>

          {/* Comentarios */}
          <Link
            href="/comentarios"
            className="group bg-white rounded-2xl p-6 border border-stone-200 hover:border-brand hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand transition-colors">
              <Phone size={24} className="text-brand group-hover:text-white transition-colors" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-2">Formulario</h3>
            <p className="text-stone-500 text-sm mb-3">Sugerencias, quejas o felicitaciones</p>
            <p className="text-brand font-medium text-sm">Deja tu opinión →</p>
          </Link>

        </div>
      </section>

      {/* ── HORARIO DE ATENCIÓN ───────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-stone-600">
            <strong className="text-stone-900">Horario de atención:</strong>{' '}
            Lunes a viernes de 8:00 AM a 6:00 PM - Sábados de 9:00 AM a 1:00 PM
          </p>
          <p className="text-stone-500 text-sm mt-2">
            Fuera de horario laboral, déjanos un mensaje y te contactamos el siguiente día hábil.
          </p>
        </div>
      </section>

      {/* ── PREGUNTAS FRECUENTES ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-50 text-brand text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl font-bold text-stone-900">Preguntas frecuentes</h2>
        </div>

        <div className="space-y-4">
          {faqs.map(({ pregunta, respuesta, icon: Icon }) => (
            <details
              key={pregunta}
              className="group bg-white rounded-2xl border border-stone-200 hover:border-stone-300 transition-colors"
            >
              <summary className="flex items-start gap-4 p-6 cursor-pointer list-none">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-brand" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-900 group-hover:text-brand transition-colors">
                    {pregunta}
                  </h4>
                </div>
                <span className="text-stone-400 group-open:rotate-180 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <p className="text-stone-600 leading-relaxed pl-14">{respuesta}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── TEMAS RÁPIDOS ─────────────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-stone-900 text-center mb-10">Temas de ayuda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/?tipoGlamping=domo"
              className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 hover:border-brand hover:shadow-md transition-all"
            >
              <HelpCircle size={20} className="text-brand" />
              <span className="text-stone-700">Buscar domos geodésicos</span>
            </Link>
            <Link
              href="/?aceptaMascotas=true"
              className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 hover:border-brand hover:shadow-md transition-all"
            >
              <HelpCircle size={20} className="text-brand" />
              <span className="text-stone-700">Glampings con mascotas</span>
            </Link>
            <Link
              href="/acerca-de-nosotros"
              className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 hover:border-brand hover:shadow-md transition-all"
            >
              <HelpCircle size={20} className="text-brand" />
              <span className="text-stone-700">¿Qué es Glamperos?</span>
            </Link>
            <Link
              href="/comentarios"
              className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 hover:border-brand hover:shadow-md transition-all"
            >
              <HelpCircle size={20} className="text-brand" />
              <span className="text-stone-700">Reportar un problema</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SER ANFITRIÓN ─────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Tienes una propiedad única?</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Únete a nuestra red de anfitriones y genera ingresos extra compartiendo tu espacio con viajeros que buscan experiencias naturales.
          </p>
          <Link
            href="/auth/registro"
            className="inline-flex items-center gap-2 bg-white text-brand hover:bg-emerald-50 font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg"
          >
            Ser anfitrión <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── AÚN NECESITAS AYUDA ───────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-16 text-center">
        <h2 className="text-2xl font-bold text-stone-900 mb-4">¿No encontraste lo que buscabas?</h2>
        <p className="text-stone-500 mb-6">
          Nuestro equipo está listo para ayudarte con cualquier consulta sobre tu reserva, pagos, o información sobre glampings.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:soporte@glamperos.com"
            className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Mail size={18} /> Enviar correo
          </a>
          <a
            href="https://wa.me/573218695196"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
        </div>
      </section>

    </main>
  )
}
