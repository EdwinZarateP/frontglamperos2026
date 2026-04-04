'use client'

import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

interface TierramontProduct {
  id: number
  title: string
  handle: string
  variants: { price: string }[]
  images: { src: string }[]
}

interface ShopifyResponse {
  products: TierramontProduct[]
}

function formatCOPLocal(value: string) {
  const num = Math.round(parseFloat(value))
  return `$${num.toLocaleString('es-CO')}`
}

function ProductCard({ product }: { product: TierramontProduct }) {
  const price = product.variants?.[0]?.price ?? '0'
  const image = product.images?.[0]?.src ?? ''
  const url = `https://tierramont.com/products/${product.handle}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-none w-48 sm:w-56 group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-stone-100 transition-all duration-300"
    >
      {/* Imagen */}
      <div className="aspect-square overflow-hidden bg-stone-50">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🏔️</div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-stone-500 font-medium line-clamp-2 leading-tight mb-1">
          {product.title}
        </p>
        <p className="text-sm font-bold text-stone-900">{formatCOPLocal(price)}</p>
        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          Ver en Tierramont <ExternalLink size={9} />
        </span>
      </div>
    </a>
  )
}

export function TierramontSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery<ShopifyResponse>({
    queryKey: ['tierramont-products'],
    queryFn: async () => {
      const res = await fetch('https://tierramont.com/products.json?limit=12')
      if (!res.ok) throw new Error('Error fetching Tierramont products')
      return res.json()
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  })

  const products = data?.products ?? []

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })
  }

  return (
    <section className="mt-12 mb-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">
            Aliados Glamperos
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
            Equípate para tu aventura 🏔️
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Ropa y accesorios outdoor de{' '}
            <a
              href="https://tierramont.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Tierramont
            </a>{' '}
            — perfectos para tu glamping
          </p>
        </div>
        <a
          href="https://tierramont.com/collections/all"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 whitespace-nowrap"
        >
          Ver todo <ExternalLink size={13} />
        </a>
      </div>

      {/* Carrusel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-none w-48 sm:w-56 rounded-2xl bg-stone-100 animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : products.length === 0 ? null : (
        <div className="relative group">
          {/* Flecha izquierda */}
          <button
            onClick={() => scroll('left')}
            aria-label="Anterior"
            className="absolute left-0 top-1/2 -translate-y-6 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200 items-center justify-center hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} className="text-stone-700" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-3 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Flecha derecha */}
          <button
            onClick={() => scroll('right')}
            aria-label="Siguiente"
            className="absolute right-0 top-1/2 -translate-y-6 translate-x-5 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-stone-200 items-center justify-center hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} className="text-stone-700" />
          </button>
        </div>
      )}
    </section>
  )
}
