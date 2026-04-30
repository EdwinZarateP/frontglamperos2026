import { CategoriasCarouselClient, type CarouselGlamping } from './CategoriasCarouselClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const GLAMPING_IDS = [
  '69d58b2c1a23825acd6ca5f3',
  '69b8b1a4776b87a18af6b6f8',
  '69d7bb3ae6cec9e546625e36',
  '69d7cdc4e6cec9e546625e38',
  '69d7d16a265a88b3c7f9bfae',
  '69d7d43b265a88b3c7f9bfb0',
  '69dafe0133e0343844d255b9',
  '69e17265583639e3b6f250d1',
  '69b8c4a1d54005b71437d9cf',
  '69d5807e1a23825acd6ca5f1',
]

async function fetchGlampingsByIds(): Promise<CarouselGlamping[]> {
  try {
    const res = await fetch(`${API_URL}/glampings/por_ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: GLAMPING_IDS }),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data as Record<string, unknown>[]).map((g) => ({
      id: (g._id ?? g.id) as string,
      nombre: (g.nombreGlamping ?? g.nombrePropiedad ?? '') as string,
      tipo: (g.tipoGlamping ?? '') as string,
      ciudad: (g.ciudadDepartamento ?? '') as string,
      imagen: ((g.imagenes as string[])?.[0] ?? '') as string,
      precio: (g.precioNoche ?? 0) as number,
    }))
  } catch {
    return []
  }
}

export async function CategoriasCarouselServer() {
  const glampings = await fetchGlampingsByIds()
  return <CategoriasCarouselClient glampings={glampings} />
}
