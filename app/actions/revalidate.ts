'use server'

import { revalidatePath } from 'next/cache'

/**
 * Invalida el caché ISR del detalle de un glamping y del catálogo home.
 * Llamar después de cualquier actualización del anfitrión o admin.
 */
export async function revalidateGlamping(id: string) {
  revalidatePath(`/glamping/${id}`)
  revalidatePath('/')
}
