'use client'

import { useEffect, useRef, useState } from 'react'
import { List, X, ChevronRight } from 'lucide-react'

interface Heading { id: string; text: string; level: number }

export default function PostTOC({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId]  = useState<string>('')
  const [open, setOpen]          = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const article = document.querySelector('.blog-prose')
    if (!article) return

    const nodes = Array.from(article.querySelectorAll('h2'))
    const items: Heading[] = nodes.map((el, i) => {
      const id = el.id || `toc-${i}`
      el.id = id
      return { id, text: el.textContent?.trim() || '', level: 2 }
    })
    setHeadings(items)

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-72px 0px -55% 0px' }
    )
    nodes.forEach((el) => observerRef.current!.observe(el))
    return () => observerRef.current?.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
    setOpen(false)
  }

  if (headings.length < 2) return null

  const List_ = () => (
    <ul className="py-1 space-y-0.5">
      {headings.map((h) => {
        const isActive = activeId === h.id
        return (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => scrollTo(h.id)}
              className={[
                'w-full text-center flex items-center justify-center px-3 py-1.5 rounded-lg transition-colors text-sm leading-snug',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
              ].join(' ')}
            >
              <span>{h.text}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* ── Desktop: sidebar sticky ─────────────────────────────────────── */}
      {!mobileOnly && <div className="sticky top-24">
        <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <List size={13} /> Contenido
            </span>
          </div>
          <div className="px-2 py-2 max-h-[65vh] overflow-y-auto">
            <List_ />
          </div>
        </div>
      </div>}

      {/* ── Mobile: floating button ─────────────────────────────────────── */}
      {mobileOnly && <div className="fixed right-4 bottom-6 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50">
              <span className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-1.5">
                <List size={13} /> Contenido
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
              >
                <X size={13} className="text-stone-500" />
              </button>
            </div>
            <div className="px-2 py-2 max-h-72 overflow-y-auto">
              <List_ />
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Tabla de contenido"
          className={[
            'w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors',
            open ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-stone-900 text-white hover:bg-stone-700',
          ].join(' ')}
        >
          {open ? <X size={18} /> : <List size={18} />}
        </button>
      </div>}
    </>
  )
}
