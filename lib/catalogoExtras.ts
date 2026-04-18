export interface CatalogoExtra {
  key: string
  nombre: string
  unidad: 'por_persona' | 'por_pareja' | 'por_grupo'
}

export const UNIDAD_LABELS: Record<string, string> = {
  por_persona: 'por persona',
  por_pareja:  'por pareja',
  por_grupo:   'por grupo',
}

export const CATALOGO_EXTRAS: CatalogoExtra[] = [
  { key: 'cabalgata',           nombre: 'Cabalgata',             unidad: 'por_persona' },
  { key: 'jacuzzi',             nombre: 'Jacuzzi privado',       unidad: 'por_pareja' },
  { key: 'masajes',             nombre: 'Masajes',               unidad: 'por_persona' },
  { key: 'desayuno',            nombre: 'Desayuno',              unidad: 'por_persona' },
  { key: 'almuerzo',            nombre: 'Almuerzo',              unidad: 'por_persona' },
  { key: 'cenaEstandar',        nombre: 'Cena estándar',         unidad: 'por_persona' },
  { key: 'cenaRomantica',       nombre: 'Cena romántica',        unidad: 'por_pareja' },
  { key: 'decoracionSencilla',  nombre: 'Decoración sencilla',   unidad: 'por_pareja' },
  { key: 'decoracionEspecial',  nombre: 'Decoración especial',   unidad: 'por_pareja' },
  { key: 'picnic',              nombre: 'Picnic',                unidad: 'por_pareja' },
  { key: 'pelicula',            nombre: 'Noche de película',     unidad: 'por_pareja' },
  { key: 'paseoLancha',         nombre: 'Paseo en lancha',       unidad: 'por_pareja' },
  { key: 'paseoBicicleta',      nombre: 'Paseo en bicicleta',    unidad: 'por_persona' },
  { key: 'caminataGuiada',      nombre: 'Caminata guiada',       unidad: 'por_persona' },
  { key: 'cuatrimoto',          nombre: 'Cuatrimoto',            unidad: 'por_persona' },
  { key: 'parapente',           nombre: 'Parapente',             unidad: 'por_persona' },
  { key: 'paseoKayak',          nombre: 'Paseo en kayak',        unidad: 'por_persona' },
  { key: 'paseoVela',           nombre: 'Paseo en velero',       unidad: 'por_pareja' },
  { key: 'paseoJetSki',         nombre: 'Paseo en jet ski',      unidad: 'por_persona' },
  { key: 'masaje',              nombre: 'Masaje individual',     unidad: 'por_persona' },
  { key: 'tour1',               nombre: 'Tour 1',                unidad: 'por_persona' },
  { key: 'tour2',               nombre: 'Tour 2',                unidad: 'por_persona' },
  { key: 'tour3',               nombre: 'Tour 3',                unidad: 'por_persona' },
  { key: 'descorche',           nombre: 'Descorche',             unidad: 'por_grupo'   },
  { key: 'kitFogata',           nombre: 'Kit de fogata',         unidad: 'por_grupo'   },
  { key: 'juegoMenteCriminal',  nombre: 'Juego mente criminal',  unidad: 'por_grupo'   },
]
