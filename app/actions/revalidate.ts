'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Invalida el caché ISR del detalle de un glamping y del catálogo home.
 * Llamar después de cualquier actualización del anfitrión o admin.
 */
export async function revalidateGlamping(id: string) {
  revalidateTag(`glamping-${id}`)  // invalida el fetch cacheado con este tag
  revalidatePath(`/glamping/${id}`) // invalida el segmento de ruta
  revalidatePath('/')               // invalida el catálogo home
}
