'use client'

import { CategoriasCarouselClient } from './CategoriasCarouselClient'
import { CategoriasCarouselStatic } from './CategoriasCarouselStatic'

interface Props {
  glampingImage?: string
}

export function CategoriasCarouselServer({ glampingImage }: Props) {
  return (
    <>
      {/* Renderizar carrusel interactivo cuando JavaScript está habilitado */}
      <noscript>
        {/* Cuando JavaScript está deshabilitado, mostrar el grid estático */}
        <CategoriasCarouselStatic glampingImage={glampingImage} />
      </noscript>
      
      {/* Cuando JavaScript está habilitado, React monta el componente de cliente */}
      <CategoriasCarouselClient glampingImage={glampingImage} />
    </>
  )
}
