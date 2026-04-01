'use client'

import { useEffect } from 'react'

/**
 * Convierte las galerías de WordPress (.wp-block-gallery) en sliders
 * con flechas de navegación y dots de paginación.
 */
export default function GalleryEnhancer() {
  useEffect(() => {
    const galleries = document.querySelectorAll<HTMLElement>('.blog-prose .wp-block-gallery')
    if (!galleries.length) return

    galleries.forEach((gallery) => {
      const figures = Array.from(gallery.querySelectorAll<HTMLElement>('figure'))
      if (figures.length < 2) return

      // Ya procesada
      if (gallery.dataset.enhanced) return
      gallery.dataset.enhanced = '1'

      // Wrapper scroll
      const track = document.createElement('div')
      track.style.cssText = 'display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;scrollbar-width:none;-ms-overflow-style:none;border-radius:12px;'
      figures.forEach((fig) => {
        fig.style.cssText = 'flex:0 0 100%;scroll-snap-align:start;margin:0;'
        const img = fig.querySelector('img')
        if (img) img.style.cssText = 'width:100%;height:280px;object-fit:cover;border-radius:12px;display:block;'
        track.appendChild(fig)
      })

      // Dots
      const dots = document.createElement('div')
      dots.style.cssText = 'display:flex;justify-content:center;gap:6px;margin-top:10px;'
      let currentIdx = 0

      const dotEls = figures.map((_, i) => {
        const d = document.createElement('button')
        d.style.cssText = `width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;transition:all 0.2s;background:${i === 0 ? '#059669' : '#d6d3d1'};padding:0;`
        d.onclick = () => goTo(i)
        dots.appendChild(d)
        return d
      })

      const goTo = (idx: number) => {
        currentIdx = idx
        track.scrollTo({ left: track.clientWidth * idx, behavior: 'smooth' })
        dotEls.forEach((d, i) => { d.style.background = i === idx ? '#059669' : '#d6d3d1' })
      }

      // Flechas
      const btn = (label: string, dir: number) => {
        const b = document.createElement('button')
        b.textContent = label
        b.style.cssText = 'position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:2;'
        b.style[dir < 0 ? 'left' : 'right'] = '10px'
        b.onclick = () => goTo(Math.max(0, Math.min(figures.length - 1, currentIdx + dir)))
        return b
      }

      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:relative;'
      wrapper.appendChild(btn('‹', -1))
      wrapper.appendChild(track)
      wrapper.appendChild(btn('›', 1))

      gallery.innerHTML = ''
      gallery.appendChild(wrapper)
      gallery.appendChild(dots)
    })
  }, [])

  return null
}
