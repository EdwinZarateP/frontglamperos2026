import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-3">
          <span className="text-xl font-bold">
            <span className="text-emerald-500">Glamp</span>
            <span className="text-white">eros</span>
          </span>
          <p className="text-sm leading-relaxed">
            La plataforma de glamping más completa de Colombia. Naturaleza y lujo, juntos.
          </p>
        </div>

        {/* Explorar */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Explorar</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/?tipo=domo" className="hover:text-white transition-colors">Domos</Link></li>
            <li><Link href="/?tipo=cabana" className="hover:text-white transition-colors">Cabañas</Link></li>
            <li><Link href="/?tipo=treehouse" className="hover:text-white transition-colors">Casas en árbol</Link></li>
            <li><Link href="/?tipo=burbuja" className="hover:text-white transition-colors">Burbujas</Link></li>
            <li><Link href="/?order_by=calificacion" className="hover:text-white transition-colors">Los mejor calificados</Link></li>
          </ul>
        </div>

        {/* Anfitrión */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Soy anfitrión</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/auth/registro" className="hover:text-white transition-colors">Publicar mi glamping</Link></li>
            <li><Link href="/anfitrion" className="hover:text-white transition-colors">Mi panel</Link></li>
            <li><Link href="/anfitrion/calendario" className="hover:text-white transition-colors">Mi calendario</Link></li>
          </ul>
        </div>

        {/* Soporte */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Soporte</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/soporte" className="hover:text-white transition-colors">Centro de ayuda</Link></li>
            <li><Link href="/comentarios" className="hover:text-white transition-colors">Deja tu opinión</Link></li>
            <li>
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-800 px-4 py-5 text-center text-xs text-stone-600">
        © {new Date().getFullYear()} Glamperos Colombia. Todos los derechos reservados.
      </div>
    </footer>
  )
}
