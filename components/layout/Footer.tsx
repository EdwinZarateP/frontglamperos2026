import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-6">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <span className="text-xl font-bold text-white">
            Glamperos
          </span>
          <p className="text-sm leading-relaxed">
            La plataforma de glamping más completa de Colombia. Naturaleza y lujo, juntos.
          </p>
          <div className="pt-3 flex items-center gap-3">
            <img
              src="https://www.fondoemprender.com/SiteAssets/FE%202020%20Home/img/LOFO%20FE%20COLOR%202022.svg"
              alt="Fondo Emprender SENA"
              className="h-7 object-contain opacity-70 hover:opacity-100 transition-opacity"
              title="Financiado por Fondo Emprender - SENA"
            />
            <img
              src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png"
              alt="SENA Colombia"
              className="h-7 object-contain opacity-70 hover:opacity-100 transition-opacity"
              title="SENA"
            />
            <img
              src="https://www.fondoemprender.com/SiteAssets/FE%202020%20Home/img/LOGO-COLOMBIA-POTENCIA-DE-LA-VIDA.png"
              alt="Colombia Potencia de la Vida"
              className="h-7 object-contain opacity-70 hover:opacity-100 transition-opacity"
              title="Gobierno de Colombia"
            />
          </div>
        </div>

        {/* Glamperos */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Glamperos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/acerca-de-nosotros" className="hover:text-white transition-colors">
                Acerca de nosotros
              </Link>
            </li>
            <li>
              <Link href="/acerca-de-nosotros#patrocinadores" className="hover:text-white transition-colors">
                Fondo Emprender · SENA
              </Link>
            </li>
            <li>
              <a
                href="https://storage.googleapis.com/glamperos-imagenes/Imagenes/RNT%20GLAMPEROS%202026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                RNT Glamperos 2026
              </a>
            </li>
          </ul>
        </div>

        {/* Síguenos */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Síguenos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://www.instagram.com/glamperos/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/glamperos/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                Facebook
              </a>
            </li>
            <li>
              <a href="https://www.youtube.com/@Glamperos" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                YouTube
              </a>
            </li>
            <li>
              <a href="https://wa.me/573215658594" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                WhatsApp · +57 321 565 8594
              </a>
            </li>
          </ul>
        </div>

        {/* Soporte */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Soporte</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/soporte" className="hover:text-white transition-colors">Centro de ayuda</Link></li>
            <li><Link href="/comentarios" className="hover:text-white transition-colors">Deja tu opinión</Link></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-stone-800 px-4 py-5 text-center text-xs text-stone-600">
        © {new Date().getFullYear()} Glamperos Colombia · Proyecto financiado por{' '}
        <Link href="/acerca-de-nosotros#patrocinadores" className="hover:text-stone-400 transition-colors underline">
          Fondo Emprender – SENA
        </Link>
        {' '}· Todos los derechos reservados.
      </div>
    </footer>
  )
}
