import Link from 'next/link'

const CATEGORIAS = [
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  },
  {
    tipo: 'CHALET',
    subtitle: 'Un espacio íntimo para descansar y reconectar',
    description: 'Chalets listos para tu escapada.'
  },
  {
    tipo: 'DOMO',
    subtitle: 'Aventura y libertad en un mismo destino',
    description: 'Descubre el encanto de un domo'
  },
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  },
  {
    tipo: 'CHALET',
    subtitle: 'Un espacio íntimo para descansar y reconectar',
    description: 'Chalets listos para tu escapada.'
  },
  {
    tipo: 'DOMO',
    subtitle: 'Aventura y libertad en un mismo destino',
    description: 'Descubre el encanto de un domo'
  },
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  },
  {
    tipo: 'CHALET',
    subtitle: 'Un espacio íntimo para descansar y reconectar',
    description: 'Chalets listos para tu escapada.'
  },
  {
    tipo: 'DOMO',
    subtitle: 'Aventura y libertad en un mismo destino',
    description: 'Descubre el encanto de un domo'
  },
  {
    tipo: 'CABAÑA',
    subtitle: 'Un descanso entre naturaleza y calma',
    description: 'Escapada de ensueño en nuestra Cabaña'
  }
]

// Placeholder image URL - will be replaced with actual glamping images later
const PLACEHOLDER_IMAGE = 'https://storage.googleapis.com/glamperos-imagenes/Imagenes/fondo%20general%20home.png'

interface Props {
  glampingImage?: string
}

export function CategoriasCarouselStatic({ glampingImage }: Props) {
  const imageUrl = glampingImage || PLACEHOLDER_IMAGE

  return (
    <section className="mt-20 mb-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 mb-3">
          Los 10 glampings más buscados en Colombia
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIAS.map((categoria, index) => (
          <div key={index}>
            <Link href="/glamping/69b8b1a4776b87a18af6b6f8">
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer">
                {/* Imagen de fondo */}
                <img
                  src={imageUrl}
                  alt={categoria.tipo}
                  className="w-full h-80 object-cover"
                />
                
                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Contenido centrado */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                    {categoria.tipo}
                  </h3>
                  <p className="text-white/90 text-sm md:text-base mb-4 drop-shadow">
                    {categoria.subtitle}
                  </p>
                </div>
                
                {/* Parte inferior */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t border-stone-200">
                  <h4 className="text-lg font-bold text-stone-900 mb-1">
                    {categoria.tipo}
                  </h4>
                  <p className="text-sm text-stone-600">
                    {categoria.description}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}