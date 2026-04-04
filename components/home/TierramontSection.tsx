'use client'

import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBag } from 'lucide-react'

const CATEGORIES = [
  { label: 'Mujer',      handle: 'mujer',           emoji: '🧘' },
  { label: 'Hombre',     handle: 'hombre',          emoji: '🧗' },
  { label: 'Accesorios', handle: 'gorros-termicos', emoji: '🎒' },
]

interface TierramontProduct {
  id: number
  title: string
  handle: string
  variants: { price: string; compare_at_price: string | null }[]
  images: { src: string }[]
}

function formatCOP(value: string) {
  const num = Math.round(parseFloat(value))
  return `$${num.toLocaleString('es-CO')}`
}

// ---------------------------------------------------------------------------
// Tarjeta — usada tanto en grid móvil como en carrusel desktop
// ---------------------------------------------------------------------------
function ProductCard({ product }: { product: TierramontProduct }) {
  const price      = product.variants?.[0]?.price ?? '0'
  const compareAt  = product.variants?.[0]?.compare_at_price
  const image      = product.images?.[0]?.src ?? ''
  const url        = `https://tierramont.com/products/${product.handle}`
  const hasDiscount = compareAt && parseFloat(compareAt) > parseFloat(price)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-100 transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 sm:flex-none sm:w-52"
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-stone-50">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-stone-100">🏔️</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            OFERTA
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3">
        <p className="text-[11px] sm:text-xs text-stone-600 font-medium line-clamp-2 leading-snug mb-1.5 min-h-[2.2rem]">
          {product.title}
        </p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <p className="text-xs sm:text-sm font-bold text-stone-900">{formatCOP(price)}</p>
          {hasDiscount && (
            <p className="text-[10px] text-stone-400 line-through">{formatCOP(compareAt!)}</p>
          )}
        </div>
      </div>
    </a>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
function useProducts(collectionHandle: string, initialProducts?: unknown[]) {
  return useQuery<{ products: TierramontProduct[] }>({
    queryKey: ['tierramont', collectionHandle],
    queryFn: async () => {
      const res = await fetch(
        `https://tierramont.com/collections/${collectionHandle}/products.json?limit=10`
      )
      if (!res.ok) throw new Error('Error fetching Tierramont')
      return res.json()
    },
    initialData: initialProducts?.length
      ? { products: initialProducts as TierramontProduct[] }
      : undefined,
    staleTime: 1000 * 60 * 30,
  })
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
interface TierramontSectionProps {
  initialProducts?: unknown[]
}

export function TierramontSection({ initialProducts }: TierramontSectionProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useProducts(
    activeCategory.handle,
    activeCategory.handle === 'mujer' ? initialProducts : undefined
  )
  const products = data?.products ?? []

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })
  }

  const handleCategoryChange = (cat: typeof CATEGORIES[0]) => {
    setActiveCategory(cat)
    scrollRef.current?.scrollTo({ left: 0 })
  }

  return (
    <section className="mt-12 mb-8 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="relative px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        {/* Fondo con imagen */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0675/8078/8976/collections/IMG_7364.jpg?v=1765389264)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-900" />

        <div className="relative z-10">

          {/* Móvil: título + link compacto en una fila */}
          <div className="flex items-center justify-between gap-3 sm:hidden mb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                Aliados Glamperos
              </span>
              <h2 className="text-lg font-bold text-white leading-tight">
                Equípate para tu aventura 🏔️
              </h2>
            </div>
            <a
              href={`https://tierramont.com/collections/${activeCategory.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1 text-emerald-400 text-xs font-semibold whitespace-nowrap"
            >
              Ver todo <ExternalLink size={11} />
            </a>
          </div>

          {/* Subtítulo solo en móvil */}
          <p className="text-stone-400 text-xs mb-4 sm:hidden">
            Ropa outdoor de{' '}
            <a href="https://tierramont.com" target="_blank" rel="noopener noreferrer"
              className="text-emerald-400 font-semibold">Tierramont
            </a>
          </p>

          {/* Desktop: layout original más amplio */}
          <div className="hidden sm:flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Aliados Glamperos
              </span>
              <h2 className="text-3xl font-bold text-white mt-1 leading-tight">
                Equípate para tu aventura 🏔️
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                Ropa y accesorios outdoor de{' '}
                <a href="https://tierramont.com" target="_blank" rel="noopener noreferrer"
                  className="text-emerald-400 font-semibold hover:underline">
                  Tierramont
                </a>{' '}
                — perfectos para tu glamping en Colombia
              </p>
            </div>
            <a
              href={`https://tierramont.com/collections/${activeCategory.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg"
            >
              <ShoppingBag size={15} />
              Ver todo
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Tabs — full width en móvil, auto en desktop */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.handle}
                onClick={() => handleCategoryChange(cat)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeCategory.handle === cat.handle
                    ? 'bg-white text-stone-900 shadow-lg scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Productos ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-6 sm:pb-8">

        {/* Skeleton */}
        {isLoading && (
          <>
            {/* Móvil: skeleton grid 2 cols */}
            <div className="grid grid-cols-2 gap-3 sm:hidden pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white/10 animate-pulse aspect-[3/4]" />
              ))}
            </div>
            {/* Desktop: skeleton carrusel */}
            <div className="hidden sm:flex gap-4 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-none w-52 rounded-2xl bg-white/10 animate-pulse aspect-[3/4]" />
              ))}
            </div>
          </>
        )}

        {!isLoading && products.length > 0 && (
          <>
            {/* ── MÓVIL: grid 2 columnas ── */}
            <div className="grid grid-cols-2 gap-3 sm:hidden pt-2">
              {products.slice(0, 6).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {/* Ver más — celda completa */}
              <a
                href={`https://tierramont.com/collections/${activeCategory.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 mt-1 flex items-center justify-center gap-2 border border-dashed border-white/20 rounded-xl py-3 text-white/50 hover:text-emerald-400 hover:border-emerald-400 transition-colors text-sm font-semibold"
              >
                <ShoppingBag size={15} />
                Ver toda la categoría {activeCategory.emoji}
                <ExternalLink size={12} />
              </a>
            </div>

            {/* ── DESKTOP: carrusel horizontal ── */}
            <div className="relative group pt-2 hidden sm:block">
              <button
                onClick={() => scroll('left')}
                aria-label="Anterior"
                className="absolute left-0 top-1/2 -translate-y-6 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={18} className="text-stone-700" />
              </button>

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
                {/* CTA card */}
                <a
                  href={`https://tierramont.com/collections/${activeCategory.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-none w-52 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400 transition-all duration-300 flex flex-col items-center justify-center gap-3 text-white/50 hover:text-emerald-400 p-6 text-center group/cta"
                >
                  <ShoppingBag size={30} className="group-hover/cta:scale-110 transition-transform" />
                  <span className="text-sm font-semibold leading-tight">
                    Ver más<br />{activeCategory.emoji} {activeCategory.label}
                  </span>
                  <ExternalLink size={14} />
                </a>
              </div>

              <button
                onClick={() => scroll('right')}
                aria-label="Siguiente"
                className="absolute right-0 top-1/2 -translate-y-6 translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={18} className="text-stone-700" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
