// lib/colombia.ts
import municipiosData from './municipios.json'

export interface CiudadColombia {
  label: string        // "San Francisco, Cundinamarca"
  ciudad: string       // "San Francisco"
  departamento: string // "Cundinamarca"
  slug: string         // "san-francisco-cundinamarca"
}

interface Municipio {
  CIUDAD: string
  DEPARTAMENTO: string
  LATITUD: number
  LONGITUD: number
}

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s]/g, '')     // quitar puntuación (comas, puntos, guiones…)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Retorna lat/lng desde municipios.json para una ciudad + departamento */
export function getCoordenadas(ciudad: string, departamento: string): { lat: number; lng: number } | null {
  const c = norm(ciudad)
  const d = norm(departamento)
  const all = municipiosData as Municipio[]

  // 1. Match exacto ciudad + departamento
  let m = all.find((m) => norm(m.CIUDAD) === c && norm(m.DEPARTAMENTO) === d)

  // 2. Fallback: si la ciudad es única en el JSON, usar esa entrada
  //    (ej: "Bogotá, Cundinamarca" → en municipios está como "Bogotá D.C.")
  if (!m) {
    const byCiudad = all.filter((m) => norm(m.CIUDAD) === c)
    if (byCiudad.length === 1) m = byCiudad[0]
  }

  return m ? { lat: m.LATITUD, lng: m.LONGITUD } : null
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const RAW: string[] = [
  // Amazonas
  "Leticia, Amazonas", "Puerto Nariño, Amazonas",

  // Antioquia
  "Medellín, Antioquia", "Bello, Antioquia", "Envigado, Antioquia", "Itagüí, Antioquia",
  "Sabaneta, Antioquia", "Rionegro, Antioquia", "Apartadó, Antioquia", "Turbo, Antioquia",
  "Caucasia, Antioquia", "Caldas, Antioquia", "La Ceja, Antioquia", "El Retiro, Antioquia",
  "Guatapé, Antioquia", "El Peñol, Antioquia", "Santa Fe de Antioquia, Antioquia",
  "Jardín, Antioquia", "Jericó, Antioquia", "Marinilla, Antioquia", "Carmen de Viboral, Antioquia",
  "Yarumal, Antioquia", "Puerto Berrío, Antioquia", "Barbosa, Antioquia",
  "Copacabana, Antioquia", "Girardota, Antioquia", "Guarne, Antioquia",
  "San Vicente, Antioquia", "El Santuario, Antioquia", "San Rafael, Antioquia",
  "San Carlos, Antioquia", "Alejandría, Antioquia", "Concepción, Antioquia",
  "San Pedro de los Milagros, Antioquia", "Entrerríos, Antioquia", "Belmira, Antioquia",
  "Don Matías, Antioquia", "San Jerónimo, Antioquia", "Sopetrán, Antioquia",
  "Olaya, Antioquia", "Liborina, Antioquia", "Buriticá, Antioquia",
  "Amagá, Antioquia", "Angelópolis, Antioquia", "Titiribí, Antioquia",
  "Fredonia, Antioquia", "Montebello, Antioquia", "Santa Bárbara, Antioquia",
  "Venecia, Antioquia", "Tarso, Antioquia", "Támesis, Antioquia",
  "La Pintada, Antioquia", "Andes, Antioquia", "Ciudad Bolívar, Antioquia",
  "Betania, Antioquia", "Salgar, Antioquia", "Urrao, Antioquia",
  "Concordia, Antioquia", "Betulia, Antioquia", "Cocorná, Antioquia",
  "San Luis, Antioquia", "San Francisco, Antioquia", "Granada, Antioquia",
  "Sonsón, Antioquia", "Abejorral, Antioquia", "La Unión, Antioquia",
  "Nariño, Antioquia", "Heliconia, Antioquia", "Ebéjico, Antioquia",
  "Anzá, Antioquia", "Chigorodó, Antioquia", "Carepa, Antioquia",
  "Necoclí, Antioquia", "Arboletes, Antioquia",

  // Arauca
  "Arauca, Arauca", "Tame, Arauca", "Saravena, Arauca",

  // Atlántico
  "Barranquilla, Atlántico", "Soledad, Atlántico", "Malambo, Atlántico",
  "Puerto Colombia, Atlántico", "Galapa, Atlántico", "Baranoa, Atlántico",

  // Bogotá Cundinamarca
  "Bogotá, Cundinamarca",

  // Bolívar
  "Cartagena, Bolívar", "Magangué, Bolívar", "Mompox, Bolívar", "Turbaco, Bolívar",
  "Arjona, Bolívar",

  // Boyacá
  "Tunja, Boyacá", "Duitama, Boyacá", "Sogamoso, Boyacá", "Chiquinquirá, Boyacá",
  "Paipa, Boyacá", "Villa de Leyva, Boyacá", "Monguí, Boyacá", "Ráquira, Boyacá",
  "Nobsa, Boyacá", "Santa Rosa de Viterbo, Boyacá", "Aquitania, Boyacá",
  "Samacá, Boyacá", "Tinjacá, Boyacá", "Sáchica, Boyacá", "Sutamarchán, Boyacá",
  "Tota, Boyacá", "Mongua, Boyacá", "Belén, Boyacá", "Cerinza, Boyacá",
  "Socha, Boyacá", "Socotá, Boyacá", "Güicán, Boyacá", "El Cocuy, Boyacá",
  "Chiscas, Boyacá", "Cubará, Boyacá", "Miraflores, Boyacá",

  // Caldas
  "Manizales, Caldas", "La Dorada, Caldas", "Chinchiná, Caldas", "Riosucio, Caldas",
  "Salamina, Caldas", "Neira, Caldas", "Villamaría, Caldas", "Anserma, Caldas",
  "Aguadas, Caldas", "Pácora, Caldas", "Supía, Caldas", "Manzanares, Caldas",
  "Marulanda, Caldas", "Pensilvania, Caldas", "Samaná, Caldas", "Victoria, Caldas",
  "Filadelfia, Caldas", "Aranzazu, Caldas", "Viterbo, Caldas",

  // Caquetá
  "Florencia, Caquetá", "San Vicente del Caguán, Caquetá",

  // Casanare
  "Yopal, Casanare", "Aguazul, Casanare", "Villanueva, Casanare", "Tauramena, Casanare",
  "Monterrey, Casanare", "Sabanalarga, Casanare",

  // Cauca
  "Popayán, Cauca", "Santander de Quilichao, Cauca", "Puerto Tejada, Cauca",
  "Silvia, Cauca", "Coconuco, Cauca", "Timbío, Cauca", "El Tambo, Cauca",

  // Cesar
  "Valledupar, Cesar", "Aguachica, Cesar", "Codazzi, Cesar",

  // Chocó
  "Quibdó, Chocó", "Nuquí, Chocó", "Bahía Solano, Chocó", "Istmina, Chocó",

  // Córdoba
  "Montería, Córdoba", "Cereté, Córdoba", "Lorica, Córdoba", "Montelíbano, Córdoba",

  // Cundinamarca
  "Facatativá, Cundinamarca", "Zipaquirá, Cundinamarca", "Fusagasugá, Cundinamarca",
  "Chía, Cundinamarca", "Cajicá, Cundinamarca", "Mosquera, Cundinamarca",
  "Madrid, Cundinamarca", "Funza, Cundinamarca","Guatavita, Cundinamarca", "Tocancipá, Cundinamarca",
  "La Calera, Cundinamarca", "Sopó, Cundinamarca", "Guasca, Cundinamarca",
  "Tabio, Cundinamarca", "Tenjo, Cundinamarca", "Subachoque, Cundinamarca",
  "El Rosal, Cundinamarca", "Bojacá, Cundinamarca", "Zipacón, Cundinamarca",
  "Arbeláez, Cundinamarca", "Nilo, Cundinamarca", "Girardot, Cundinamarca",
  "Villeta, Cundinamarca", "Nimaima, Cundinamarca", "Nocaima, Cundinamarca",
  "La Vega, Cundinamarca", "San Francisco, Cundinamarca", "Sasaima, Cundinamarca",
  "Albán, Cundinamarca", "Vergara, Cundinamarca", "Útica, Cundinamarca",
  "Quebradanegra, Cundinamarca", "Supatá, Cundinamarca",
  "Guayabal de Síquima, Cundinamarca", "Bituima, Cundinamarca", "Vianí, Cundinamarca",
  "Anapoima, Cundinamarca", "La Mesa, Cundinamarca", "Apulo, Cundinamarca",
  "Tena, Cundinamarca", "Cachipay, Cundinamarca", "Anolaima, Cundinamarca",
  "El Colegio, Cundinamarca", "Viotá, Cundinamarca", "Ricaurte, Cundinamarca",
  "Tocaima, Cundinamarca", "Agua de Dios, Cundinamarca", "Jerusalén, Cundinamarca",
  "San Juan de Rioseco, Cundinamarca", "Chaguaní, Cundinamarca",
  "Silvania, Cundinamarca", "San Bernardo, Cundinamarca", "Pasca, Cundinamarca",
  "Sibaté, Cundinamarca", "Soacha, Cundinamarca",
  "Gachancipá, Cundinamarca", "Nemocón, Cundinamarca", "Ubaté, Cundinamarca",
  "Suesca, Cundinamarca", "Sesquilé, Cundinamarca", "Chocontá, Cundinamarca",
  "Villapinzón, Cundinamarca", "Lenguazaque, Cundinamarca", "Cucunubá, Cundinamarca",
  "Tausa, Cundinamarca", "Cogua, Cundinamarca", "Pacho, Cundinamarca",
  "La Palma, Cundinamarca", "Yacopí, Cundinamarca", "San Cayetano, Cundinamarca",
  "Topaipí, Cundinamarca", "Guayabetal, Cundinamarca", "Une, Cundinamarca",
  "Chipaque, Cundinamarca", "Choachí, Cundinamarca", "Ubaque, Cundinamarca",
  "Fómeque, Cundinamarca", "Cáqueza, Cundinamarca", "Quetame, Cundinamarca",
  "Fosca, Cundinamarca", "Medina, Cundinamarca", "Paratebueno, Cundinamarca",
  "Ubalá, Cundinamarca", "Gachalá, Cundinamarca", "Gachetá, Cundinamarca",
  "Junín, Cundinamarca", "Manta, Cundinamarca", "Machetá, Cundinamarca",
  "Tibiritá, Cundinamarca", "Gama, Cundinamarca",

  // Guainía
  "Inírida, Guainía",

  // Guaviare
  "San José del Guaviare, Guaviare",

  // Huila
  "Neiva, Huila", "Pitalito, Huila", "Garzón, Huila", "La Plata, Huila",
  "San Agustín, Huila", "Isnos, Huila", "Campoalegre, Huila",
  "Acevedo, Huila", "Timaná, Huila", "Saladoblanco, Huila",
  "Palestina, Huila", "Suaza, Huila",

  // La Guajira
  "Riohacha, La Guajira", "Maicao, La Guajira", "Uribia, La Guajira",
  "Manaure, La Guajira",

  // Magdalena
  "Santa Marta, Magdalena", "Ciénaga, Magdalena", "Fundación, Magdalena",
  "El Banco, Magdalena", "Aracataca, Magdalena",

  // Meta
  "Villavicencio, Meta", "Acacías, Meta", "Granada, Meta", "San Martín, Meta",
  "Puerto López, Meta", "Restrepo, Meta", "Cumaral, Meta", "Lejanías, Meta",
  "La Macarena, Meta",

  // Nariño
  "Pasto, Nariño", "Tumaco, Nariño", "Ipiales, Nariño", "Túquerres, Nariño",
  "La Unión, Nariño", "Sandoná, Nariño", "La Florida, Nariño",

  // Norte de Santander
  "Cúcuta, Norte de Santander", "Ocaña, Norte de Santander",
  "Pamplona, Norte de Santander", "Villa del Rosario, Norte de Santander",
  "Chinácota, Norte de Santander",

  // Putumayo
  "Mocoa, Putumayo", "Puerto Asís, Putumayo", "Sibundoy, Putumayo",

  // Quindío
  "Armenia, Quindío", "Calarcá, Quindío", "Montenegro, Quindío",
  "Salento, Quindío", "Filandia, Quindío", "Pijao, Quindío", "Buenavista, Quindío",
  "Circasia, Quindío", "Génova, Quindío", "Córdoba, Quindío",
  "Quimbaya, Quindío", "La Tebaida, Quindío",

  // Risaralda
  "Pereira, Risaralda", "Dosquebradas, Risaralda", "Santa Rosa de Cabal, Risaralda",
  "La Virginia, Risaralda", "Marsella, Risaralda", "Santuario, Risaralda",
  "Belén de Umbría, Risaralda", "Apía, Risaralda", "Balboa, Risaralda",
  "Mistrató, Risaralda", "Pueblo Rico, Risaralda", "Quinchía, Risaralda",

  // San Andrés y Providencia
  "San Andrés, San Andrés y Providencia", "Providencia, San Andrés y Providencia",

  // Santander
  "Bucaramanga, Santander", "Floridablanca, Santander", "Girón, Santander",
  "Piedecuesta, Santander", "Barrancabermeja, Santander", "Socorro, Santander",
  "San Gil, Santander", "Vélez, Santander", "Barbosa, Santander","Velez, Santander",
  "Lebrija, Santander", "Los Santos, Santander", "Curití, Santander",
  "Barichara, Santander", "Guane, Santander", "Zapatoca, Santander",
  "Aratoca, Santander", "Villanueva, Santander", "Cepitá, Santander",
  "Pinchote, Santander", "Charalá, Santander", "Duitama, Santander",

  // Sucre
  "Sincelejo, Sucre", "Corozal, Sucre", "Sampués, Sucre",

  // Tolima
  "Ibagué, Tolima", "Espinal, Tolima", "Melgar, Tolima", "Honda, Tolima",
  "Chaparral, Tolima", "Mariquita, Tolima", "Líbano, Tolima",
  "Ambalema, Tolima", "Fresno, Tolima", "Lérida, Tolima",
  "Venadillo, Tolima", "Alvarado, Tolima", "Flandes, Tolima",
  "Cunday, Tolima", "Villarrica, Tolima", "Carmen de Apicalá, Tolima",

  // Valle del Cauca
  "Cali, Valle del Cauca", "Buenaventura, Valle del Cauca", "Palmira, Valle del Cauca",
  "Tuluá, Valle del Cauca", "Buga, Valle del Cauca", "Cartago, Valle del Cauca",
  "Yumbo, Valle del Cauca", "Jamundí, Valle del Cauca", "Candelaria, Valle del Cauca",
  "Dagua, Valle del Cauca", "Ginebra, Valle del Cauca", "Sevilla, Valle del Cauca",
  "Caicedonia, Valle del Cauca", "Trujillo, Valle del Cauca", "Riofrío, Valle del Cauca",
  "Ansermanuevo, Valle del Cauca", "La Unión, Valle del Cauca", "Roldanillo, Valle del Cauca",
  "El Cerrito, Valle del Cauca", "Guacarí, Valle del Cauca", "Restrepo, Valle del Cauca",

  // Vaupés
  "Mitú, Vaupés",

  // Vichada
  "Puerto Carreño, Vichada",
]

// Contar cuántas ciudades comparten el mismo slug simple (sin departamento)
const _slugCount: Record<string, number> = {}
RAW.forEach((raw) => {
  const key = slugify(raw.slice(0, raw.indexOf(', ')))
  _slugCount[key] = (_slugCount[key] || 0) + 1
})

export const CIUDADES_COLOMBIA: CiudadColombia[] = RAW.map((raw) => {
  const commaIdx = raw.indexOf(', ')
  const ciudad = raw.slice(0, commaIdx)
  const departamento = raw.slice(commaIdx + 2)
  const citySlug = slugify(ciudad)
  // Solo agrega el departamento al slug si hay otra ciudad con el mismo nombre
  const slug = _slugCount[citySlug] > 1
    ? slugify(`${ciudad} ${departamento}`)
    : citySlug
  return { label: raw, ciudad, departamento, slug }
})
