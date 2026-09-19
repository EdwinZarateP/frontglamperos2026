import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * Webhook de revalidación del blog.
 *
 * Lo llama el backend (POST /blog publicar) para que un artículo recién
 * publicado aparezca de inmediato, sin esperar la ISR de 1h.
 *
 * Body: { secret: string, paths?: string[] }
 * La secret debe coincidir con BLOG_REVALIDATE_SECRET del backend.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ revalidated: false, message: 'REVALIDATE_SECRET no configurado' }, { status: 500 })
  }

  let body: { secret?: string; paths?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ revalidated: false, message: 'Body JSON inválido' }, { status: 400 })
  }

  if (body.secret !== secret) {
    return NextResponse.json({ revalidated: false, message: 'Secret inválida' }, { status: 401 })
  }

  // Paths por defecto del blog + los específicos que envíe el backend
  const paths = new Set<string>(['/blog', '/en/blog', '/sitemap.xml'])
  for (const p of body.paths || []) {
    if (typeof p === 'string' && p.startsWith('/')) paths.add(p)
  }

  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch {
      // Un path dinámico inexistente no debe romper los demás
    }
  }

  return NextResponse.json({ revalidated: true, paths: [...paths] })
}
