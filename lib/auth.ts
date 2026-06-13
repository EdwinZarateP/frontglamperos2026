/**
 * Helpers de validación de sesión.
 *
 * El frontend no depende de ninguna librería JWT (no hay jwt-decode instalado),
 * así que decodificamos el payload manualmente — solo necesitamos leer el claim `exp`.
 */

interface JwtPayload {
  exp?: number
  sub?: string
  [key: string]: unknown
}

/**
 * Decodifica el payload (segunda parte) de un JWT. Devuelve null si está malformado.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // base64url -> base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    // rellenar hasta múltiplo de 4
    const pad = base64.length % 4
    if (pad) base64 += '='.repeat(4 - pad)

    const binary = atob(base64)
    // decodificar UTF-8 (por si el payload trae caracteres no ASCII)
    const json = decodeURIComponent(
      binary
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Indica si un JWT ya expiró según su claim `exp`.
 *
 * - Token sin `exp` -> false (no inventamos expiración; /auth/me decide).
 * - Token malformado -> false (deja que /auth/me sea el árbitro final).
 * - Token vencido -> true.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload) return false
  if (typeof payload.exp !== 'number') return false
  return payload.exp * 1000 < Date.now()
}
