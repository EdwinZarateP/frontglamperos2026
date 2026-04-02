'use client'

import { CategoriasCarouselClient } from './CategoriasCarouselClient'

interface Props {
  glampingImage?: string
}

export function CategoriasCarouselServer({ glampingImage }: Props) {
  return <CategoriasCarouselClient glampingImage={glampingImage} />
}
