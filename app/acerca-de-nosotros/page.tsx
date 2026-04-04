import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, Users, ShieldCheck, Star, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Acerca de Nosotros | Glamperos Colombia',
  description:
    'Conoce la historia de Glamperos, la plataforma de glamping más completa de Colombia. Proyecto respaldado por el Fondo Emprender del SENA y el Gobierno Nacional.',
  alternates: { canonical: '/acerca-de-nosotros' },
  openGraph: {
    title: 'Acerca de Nosotros | Glamperos Colombia',
    description:
      'Glamperos nació para conectar a los colombianos con la naturaleza a través del glamping. Conoce nuestro propósito y el respaldo institucional que nos impulsa.',
    type: 'website',
    images: [{ url: 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Acerca de Nosotros | Glamperos Colombia',
    description:
      'Glamperos nació para conectar a los colombianos con la naturaleza a través del glamping. Conoce nuestro propósito y el respaldo institucional que nos impulsa.',
    images: ['https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'],
  },
}

const valores = [
  {
    icon: Leaf,
    titulo: 'Naturaleza primero',
    texto:
      'Promovemos el turismo sostenible y el respeto por los ecosistemas colombianos en cada experiencia que publicamos.',
  },
  {
    icon: Users,
    titulo: 'Comunidad local',
    texto:
      'Apoyamos a anfitriones locales y emprendedores rurales que abren las puertas de su territorio al mundo.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Confianza y seguridad',
    texto:
      'Cada glamping pasa por un proceso de verificación para garantizar la mejor experiencia a nuestros viajeros.',
  },
  {
    icon: Star,
    titulo: 'Experiencias únicas',
    texto:
      'Desde domos bajo las estrellas hasta casas en árbol en la selva: curated content que va más allá de lo ordinario.',
  },
]

export default function AcercaDeNosotrosPage() {
  return (
    <main className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative bg-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png')] bg-cover bg-center opacity-25" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-brand/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Nuestra historia
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Conectamos a Colombia con{' '}
            <span className="text-emerald-400">la naturaleza</span>
          </h1>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Glamperos es la plataforma líder de glamping en Colombia. Nacimos
            con el propósito de hacer accesible una nueva forma de viajar:
            cómoda, sostenible y auténticamente colombiana.
          </p>
        </div>
      </section>

      {/* ── QUÉ ES GLAMPEROS ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-5">¿Qué es Glamperos?</h2>
            <div className="space-y-4 text-stone-600 leading-relaxed">
              <p>
                <strong className="text-stone-800">Glamperos</strong> es una plataforma digital colombiana que
                conecta a viajeros con los mejores alojamientos de glamping del país: domos geodésicos,
                cabañas de lujo, casas en árbol, burbujas transparentes y mucho más.
              </p>
              <p>
                Creemos que disfrutar la naturaleza no significa renunciar a la comodidad. Nuestro modelo
                permite que anfitriones locales — desde el Eje Cafetero hasta la Sierra Nevada — publiquen
                sus propiedades y lleguen a miles de viajeros en todo Colombia y el exterior.
              </p>
              <p>
                Para los huéspedes, ofrecemos una experiencia de reserva sencilla, segura y transparente,
                con pagos en línea, calendarios de disponibilidad en tiempo real y soporte en cada etapa
                del viaje.
              </p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src="https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png"
              alt="Glamping en Colombia - naturaleza y lujo"
              className="w-full h-72 object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── MISIÓN Y VISIÓN ───────────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Leaf size={20} className="text-brand" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Nuestra misión</h3>
              <p className="text-stone-600 leading-relaxed">
                Democratizar el acceso al turismo rural de lujo en Colombia, generando ingresos
                sostenibles para comunidades locales y experiencias memorables para cada viajero.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <Star size={20} className="text-brand" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Nuestra visión</h3>
              <p className="text-stone-600 leading-relaxed">
                Ser el referente latinoamericano de glamping y turismo experiencial, donde Colombia
                sea reconocida por la riqueza y diversidad de sus destinos naturales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALORES ───────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-stone-900 text-center mb-12">Lo que nos mueve</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {valores.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={18} className="text-brand" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-900 mb-1">{titulo}</h4>
                <p className="text-sm text-stone-500 leading-relaxed">{texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESPALDO INSTITUCIONAL ────────────────────────────────────────────── */}
      <section id="patrocinadores" className="bg-gradient-to-br from-stone-900 to-emerald-950 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-emerald-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Respaldo institucional
          </span>
          <h2 className="text-3xl font-bold mb-4">Con el apoyo del Estado colombiano</h2>
          <p className="text-stone-300 max-w-2xl mx-auto mb-14 leading-relaxed">
            Glamperos fue seleccionado y financiado por el{' '}
            <strong className="text-white">Fondo Emprender del SENA</strong>, el programa de
            emprendimiento más importante del Gobierno Nacional de Colombia. Este respaldo refleja
            el potencial de nuestra propuesta para generar empleo, impulsar el turismo rural y
            fortalecer la economía de las regiones.
          </p>

          {/* Logos */}
          <div className="flex flex-wrap items-center justify-center gap-10">

            {/* Fondo Emprender */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg flex items-center justify-center w-44 h-24">
                <img
                  src="https://www.fondoemprender.com/SiteAssets/FE%202020%20Home/img/LOFO%20FE%20COLOR%202022.svg"
                  alt="Fondo Emprender"
                  className="max-h-14 max-w-full object-contain"
                />
              </div>
              <p className="text-xs text-stone-400">Fondo Emprender</p>
            </div>

            {/* SENA */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg flex items-center justify-center w-44 h-24">
                <img
                  src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
                  alt="SENA - Servicio Nacional de Aprendizaje"
                  className="max-h-14 max-w-full object-contain"
                />
              </div>
              <p className="text-xs text-stone-400">SENA</p>
            </div>

            {/* Gobierno de Colombia */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg flex items-center justify-center w-44 h-24">
                <img
                  src="https://www.fondoemprender.com/SiteAssets/FE%202020%20Home/img/LOGO-COLOMBIA-POTENCIA-DE-LA-VIDA.png"
                  alt="Colombia Potencia de la Vida - Gobierno Nacional"
                  className="max-h-14 max-w-full object-contain"
                />
              </div>
              <p className="text-xs text-stone-400">Gobierno de Colombia</p>
            </div>

          </div>

          <p className="mt-12 text-sm text-stone-400 max-w-xl mx-auto">
            El Fondo Emprender es un fondo de capital semilla administrado por el SENA que financia
            proyectos empresariales presentados por aprendices, practicantes universitarios y
            profesionales con menos de dos años de graduados.
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-stone-900 mb-4">¿Listo para explorar Colombia?</h2>
        <p className="text-stone-500 mb-8">
          Descubre cientos de glampings únicos en todo el país y vive una experiencia que no olvidarás.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-light text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
        >
          Explorar glampings <ArrowRight size={18} />
        </Link>
      </section>

    </main>
  )
}
