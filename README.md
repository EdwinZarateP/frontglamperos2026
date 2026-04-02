# Glamperos Frontend v1.0 — Documentación Técnica

Frontend de la plataforma de glamping tipo Airbnb para Colombia.
Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS + React Query + Zustand**.

> Este documento está diseñado para que cualquier desarrollador (o IA) pueda retomar el trabajo sin tener que leer todo el código.

---

## Índice

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura de Archivos](#2-estructura-de-archivos)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Arrancar el Proyecto](#4-arrancar-el-proyecto)
5. [Sistema de URLs SEO](#5-sistema-de-urls-seo)
6. [Buscador del Home](#6-buscador-del-home)
7. [Búsqueda por Radio Geográfico](#7-búsqueda-por-radio-geográfico)
8. [Estado Global — Zustand](#8-estado-global--zustand)
9. [Hooks de Datos — React Query](#9-hooks-de-datos--react-query)
10. [Autenticación](#10-autenticación)
11. [Páginas y Rutas](#11-páginas-y-rutas)
12. [Componentes Clave](#12-componentes-clave)
13. [Tipos TypeScript](#13-tipos-typescript)
14. [Pendientes y TODOs](#14-pendientes-y-todos)

---

## 1. Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Estado global | Zustand |
| Data fetching | TanStack React Query v5 |
| HTTP client | Axios (`lib/api.ts`) |
| Iconos | React Icons |
| Formularios | React state local (sin librería) |

---

## 2. Estructura de Archivos

```
frontglamperos2026/
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout (fuentes, providers)
│   ├── page.tsx                     # Home (SSR con fetchGlampingsSSR)
│   ├── HomeClient.tsx               # Parte interactiva del home
│   ├── [...slug]/page.tsx           # Catch-all para URLs SEO (/bogota/domo/jacuzzi)
│   ├── glamping/
│   │   └── [id]/
│   │       ├── page.tsx             # Detalle del glamping (SSR)
│   │       ├── GlampingDetailClient.tsx
│   │       ├── fotos/page.tsx       # Galería de fotos
│   │       └── reservar/page.tsx    # Formulario de reserva ⚠️ calendario pendiente
│   ├── pago/
│   │   ├── [reservaId]/page.tsx     # Inicia pago Wompi
│   │   └── resultado/page.tsx       # Resultado del pago
│   ├── mis-reservas/page.tsx        # Reservas del usuario
│   ├── favoritos/page.tsx           # Favoritos del usuario
│   ├── perfil/page.tsx              # Perfil del usuario
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   └── callback/page.tsx        # Callback Google OAuth
│   ├── calificaciones/
│   │   └── valorar/[token]/page.tsx # Valorar reserva (link único)
│   ├── anfitrion/                   # Panel del anfitrión
│   │   ├── page.tsx                 # Dashboard
│   │   ├── glampings/               # Mis glampings + CRUD
│   │   ├── reservas/                # Reservas de mis glampings
│   │   └── calendario/              # Calendario de disponibilidad
│   ├── admin/                       # Panel de administración
│   │   ├── page.tsx
│   │   ├── glampings/               # Aprobar/rechazar glampings
│   │   ├── usuarios/
│   │   ├── reservas/
│   │   └── comentarios/
│   └── acerca-de-nosotros/page.tsx
├── components/
│   ├── home/
│   │   ├── SearchFilters.tsx        # Buscador Airbnb-style (paneles, CalendarioRango)
│   │   └── GlampingCard.tsx         # Tarjeta de glamping
│   ├── layout/
│   │   └── Navbar.tsx               # Navegación principal
│   └── ui/                          # Componentes reutilizables
├── hooks/
│   ├── useGlampings.ts              # React Query: listado home
│   ├── useGlamping.ts               # React Query: detalle glamping
│   └── useAuth.ts                   # Estado de autenticación
├── lib/
│   ├── api.ts                       # Axios instance con baseURL + JWT interceptor
│   ├── filtros.ts                   # Helpers de URL, parseo de filtros, SEO meta
│   ├── colombia.ts                  # Catálogo de ciudades, slugs, coordenadas
│   └── utils.ts                     # formatCOP, formatDate, etc.
├── store/
│   └── searchStore.ts               # Zustand: filtros activos de búsqueda
├── types/
│   └── index.ts                     # Tipos TypeScript globales
└── public/
    └── municipios.json              # ~1100 municipios colombianos con lat/lng
```

---

## 3. Variables de Entorno

Crea `.env.local` en la raíz de `frontglamperos2026/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

---

## 4. Arrancar el Proyecto

```bash
cd frontglamperos2026
npm install
npm run dev        # http://localhost:3000
npm run build      # Producción
```

---

## 5. Sistema de URLs SEO

Las URLs siguen el patrón `/ciudad/tipo/amenidad`:

| URL | Significado |
|-----|-------------|
| `/` | Home sin filtros |
| `/bogota` | Glampings cerca a Bogotá (130 km) |
| `/bogota/domo` | Domos cerca a Bogotá |
| `/bogota/jacuzzi` | Glampings con jacuzzi cerca a Bogotá |
| `/bogota/domo/jacuzzi` | Domos con jacuzzi cerca a Bogotá |
| `/san-francisco-cundinamarca` | Ciudad con nombre duplicado → slug largo |

### Slugs de ciudades

Generados en `lib/colombia.ts` con lógica inteligente:
- Nombre único en Colombia → slug simple (`bogota`, `medellin`, `cartagena`)
- Nombre duplicado (ej: San Francisco en Antioquia y Cundinamarca) → slug largo (`san-francisco-cundinamarca`)
- `norm()` normaliza acentos Y puntuación → "Bogotá D.C." se convierte en "bogota dc"

### Flujo de parseo de URL

1. `[...slug]/page.tsx` recibe los segmentos de la URL
2. Llama a `parseFiltrosFromSlug(slugs)` en `lib/filtros.ts`
3. Reconoce: ciudad → tipo (`domo`, `cabana`, etc.) → amenidades principales (`jacuzzi`, `piscina`)
4. Resuelve coordenadas con `getCoordenadas()` desde `municipios.json`
5. Construye `FiltrosHome` con `lat`/`lng`/`radio_km=130`

### Helpers en `lib/filtros.ts`

| Función | Descripción |
|---------|-------------|
| `buildUrlFromFiltros(filtros)` | Construye la URL limpia a partir de los filtros activos |
| `parseFiltrosFromSlug(slugs)` | Convierte segmentos de path → FiltrosHome |
| `parseFiltrosFromSearchParams(sp)` | Convierte query params → FiltrosHome |
| `buildSeoMeta(filtros)` | Genera `title` y `description` para SEO |
| `findCiudadBySlug(slug)` | Busca ciudad por slug |
| `findCiudadByNombre(nombre)` | Busca ciudad por nombre |

---

## 6. Buscador del Home

Implementado en `components/home/SearchFilters.tsx`.

### Principio de diseño clave
**Todo el estado de los filtros es LOCAL** hasta que el usuario hace clic en "Buscar".
No hay llamadas a la API mientras el usuario interactúa con los paneles.
Solo en `handleSearch()` se actualiza el store de Zustand y se navega a la nueva URL.

### Paneles
Cada sección (Ubicación, Fechas, Huéspedes, Precio) tiene su propio `relative div` padre,
por lo que su panel desplegable aparece debajo del botón correcto (no del siguiente).

### CalendarioRango (sub-componente interno)
Definido dentro de `SearchFilters.tsx`:
- Dos meses lado a lado, estilo Airbnb
- Selección de rango con efecto hover (cápsula verde entre inicio y fin)
- Navegar meses con botones `<` y `>`

### Ciudades como chips rápidos
Las ciudades del panel de ubicación están hardcodeadas en `SearchFilters.tsx`.
Bogotá usa label `"Bogotá, Cundinamarca"` para que el slug resulte en `/bogota`.

### Huéspedes
El control UI muestra 2 por defecto. El valor se incluye en la URL/API solo si es `> 2`.

---

## 7. Búsqueda por Radio Geográfico

En lugar de filtrar por nombre exacto de ciudad, se usa búsqueda por radio de 130 km:

1. `getCoordenadas(ciudad, departamento)` en `lib/colombia.ts` busca en `municipios.json`
   - Primero: coincidencia exacta ciudad + departamento (normalizado con `norm()`)
   - Fallback: solo por ciudad, si es única en Colombia
2. Se pasan `lat`, `lng`, `radio_km=130` a la API
3. El hook `useGlampings.ts` **omite** el parámetro `ciudad` cuando hay `lat`/`lng` presentes
4. El backend filtra por distancia haversine

**Resultado:** Buscar "Funza" muestra glampings en toda la sabana de Bogotá aunque Funza no tenga glampings propios.

---

## 8. Estado Global — Zustand

```ts
// store/searchStore.ts
interface SearchState {
  filtros: FiltrosHome
  setFiltros: (f: Partial<FiltrosHome>) => void
  resetFiltros: () => void
}

const defaultFiltros: FiltrosHome = {
  page: 1,
  limit: 20,
  order_by: 'calificacion',
  // NO incluye huespedes:2 — ese valor es solo para el control UI
}
```

El store se actualiza únicamente desde:
- `handleSearch()` en `SearchFilters.tsx`
- `[...slug]/page.tsx` al parsear la URL actual (sincroniza el store con la URL)

---

## 9. Hooks de Datos — React Query

### `useGlampings` (listado home)
```ts
// hooks/useGlampings.ts
// Query key: ['glampings', filtros]
// Transformación: omite 'ciudad' si hay lat/lng (radio search)
queryFn: async () => {
  const { ciudad: _ciudad, ...rest } = filtros
  const params = filtros.lat != null ? rest : filtros
  const { data } = await api.get('/glampings/home', { params })
  return data
}
```

### `useGlamping` (detalle)
```ts
// Query key: ['glamping', id]
// GET /glampings/{id}
```

---

## 10. Autenticación

- JWT almacenado en `localStorage` (key: `token`)
- `lib/api.ts` tiene un interceptor que añade `Authorization: Bearer <token>` en cada request
- Login email/password: `POST /auth/login`
- Login Google: botón → `GET /auth/google/authorize` → callback en `/auth/callback`
- El hook `useAuth` decodifica el payload del JWT (userId, rol, nombre)

---

## 11. Páginas y Rutas

| Ruta | Descripción | Auth |
|------|-------------|------|
| `/` | Home con listado | No |
| `/[...slug]` | Búsqueda filtrada SEO | No |
| `/glamping/[id]` | Detalle del glamping | No |
| `/glamping/[id]/fotos` | Galería completa | No |
| `/glamping/[id]/reservar` | Formulario de reserva | Sí |
| `/pago/[reservaId]` | Iniciar pago Wompi | Sí |
| `/pago/resultado` | Resultado del pago | No |
| `/mis-reservas` | Mis reservas | Sí |
| `/favoritos` | Mis favoritos | Sí |
| `/perfil` | Mi perfil | Sí |
| `/auth/login` | Login | No |
| `/auth/registro` | Registro | No |
| `/calificaciones/valorar/[token]` | Valorar reserva | No (token en URL) |
| `/anfitrion/*` | Panel del anfitrión | Sí (anfitrion/admin) |
| `/admin/*` | Panel admin | Sí (admin) |

---

## 12. Componentes Clave

### `SearchFilters.tsx`
El buscador del home. Ver sección 6 para detalles completos.
- Maneja estado local para todos los filtros
- Sub-componente `CalendarioRango` para selección de fechas con rango

### `GlampingCard.tsx`
Tarjeta de glamping para el listado. Muestra imagen, nombre, ciudad, precio/noche, calificación y botón de favorito.

### `Navbar.tsx`
Navegación principal con menú de usuario (login/logout/perfil/panel según rol).

---

## 13. Tipos TypeScript

Los tipos globales están en `types/index.ts`. Los más importantes:

```ts
interface FiltrosHome {
  page?: number
  limit?: number
  order_by?: string
  ciudad?: string
  tipo?: string
  amenidades?: string       // comma-separated: "jacuzzi,piscina"
  huespedes?: number
  fecha_inicio?: string     // YYYY-MM-DD
  fecha_fin?: string
  acepta_mascotas?: boolean
  lat?: number
  lng?: number
  radio_km?: number
  precio_max?: number
}

interface HomeResponse {
  glampings: GlampingResumen[]
  total: number
  page: number
  pages: number
}
```

---

## 14. Pendientes y TODOs

### ⚠️ URGENTE: Calendario del formulario de reserva

**Archivo:** `app/glamping/[id]/reservar/page.tsx`

El selector de fechas usa `<input type="date">` nativo que se ve horrible.

**Solución:** Reemplazar con el componente `CalendarioRango` (ya implementado en `SearchFilters.tsx`)
adaptado para:
- Bloquear fechas no disponibles (vienen de `GET /glampings/{id}/calendario`)
- Actualizar el cálculo de precio dinámicamente al cambiar el rango

### Otros pendientes
- [ ] Vista de mapa (Leaflet/Mapbox) para visualizar glampings geográficamente
- [ ] Paginación / "Ver más" en el listado (actualmente carga 20 y no pagina)
- [ ] CalendarioRango en mobile (colapsar a 1 mes en pantallas pequeñas)
- [ ] Página 404 personalizada para glampings no encontrados
- [ ] Optimistic UI en favoritos (toggle inmediato sin esperar la API)

---

## Changelog

### v1.4 — 2026-04-02
**Correcciones de UI en la página de detalle de glamping:**

**1. Botón de WhatsApp flotante (WhatsAppFloatingButton.tsx):**
- **Z-index corregido**: Cambiado de `z-[9999]` a `z-40`
  - El botón ya no aparece por encima de los modales
  - Jerarquía corregida: WhatsApp `z-40` < Modales `z-50`/`z-[60]`
- **Posición en móvil ajustada**: Cambiado de `bottom-44` a `bottom-24`
  - El botón ahora aparece apenas arriba del formulario de reservar
  - Ya no está muy arriba en pantallas pequeñas
  - Mejor UX en dispositivos móviles

**2. Modal de calendario (GlampingDetailClient.tsx):**
- **Centrado vertical**: Cambiado de `flex items-end sm:items-center` a `flex items-center`
  - El calendario ahora siempre aparece centrado verticalmente en la pantalla
  - Ya no está pegado abajo en dispositivos móviles
  - Experiencia consistente en todos los tamaños de pantalla
- **Eliminada clase condicional** que forzaba `items-end` en móvil

**3. Limpieza de UI en página de detalle:**
- **Eliminado badge de tipo sobre imágenes** (pantallas grandes):
  - Removido el badge que mostraba "chalet", "domo", etc. sobre las imágenes
  - Ahora solo se muestra la ubicación: "San Francisco, Cundinamarca"
  - Diseño más limpio en la galería de fotos
- **Eliminados botones del sidebar**:
  - Removidos los tres botones del formulario de reserva en desktop:
    - "Copiar info para WhatsApp"
    - "Compartir enlace"
    - "Guardar en favoritos"
  - Los botones siguen disponibles en la parte superior (header)
  - Sidebar más limpio y enfocado en la reserva

**Archivos modificados:**
- `components/home/WhatsAppFloatingButton.tsx`: Z-index y posición del botón WhatsApp
- `app/glamping/[id]/GlampingDetailClient.tsx`: Calendario centrado, eliminación de botones del sidebar y badge de tipo

### v1.3 — 2026-04-02
**Mejoras en la experiencia de reserva en pantallas pequeñas y desktop:**

**1. Optimización del componente GlampingDetailClient.tsx**

**Eliminación de console.log:**
- Se eliminaron todos los console.log del código
- La consola de F12 ahora está limpia
- Mejora el rendimiento y reduce ruido en debug

**Mejoras en la barra inferior móvil:**
- El botón "Reservar" ahora es verde llamativo (`bg-emerald-600 hover:bg-emerald-700`)
- El botón SIEMPRE está habilitado, sin condición de disabled
- Al hacer clic, abre el modal de reserva donde el usuario puede seleccionar fechas, huéspedes, mascotas y extras
- El lado izquierdo de la barra (Total/Precio por noche) ahora es clickeable
- Al hacer clic en el Total/Precio por noche, abre el modal de reserva
- Muestra error si no hay fechas seleccionadas
- Cursor pointer indica que es clickeable
- Clase `flex-1` para que ocupe el espacio disponible

**Mejoras en el modal de reserva:**
- Padding reducido en el botón "Confirmar reserva" en móvil (`px-3 py-2.5`)
- Padding en desktop se mantiene (`px-6 py-4`)
- El botón se ve más compacto y proporcionado en pantallas pequeñas
- Ancho del botón: `flex-1` en móvil, `w-64` en desktop
- Selectores responsive más pequeños en móvil (padding, iconos y botones)
- Fechas compactas: sin año si es el mismo año
- Footer equilibrado: botón con ancho proporcional

**Mejoras en el calendario:**
- Posicionado al final del componente del modal de reserva
- z-index: `z-[60]` (más alto que el modal de reserva que es `z-50`)
- Aparece sobre el modal de reserva cuando se abre
- Centrado verticalmente en móvil cuando se abre desde el modal (`items-center`)
- Clase condicional para centrado solo cuando el modal de reserva está abierto

**Mejoras en botones de acción (móvil):**
- Botones de WhatsApp (Copiar info/Compartir/Guardar) completamente ocultos cuando el modal está abierto
- Usando `hidden` en lugar de `opacity-0` para eliminación completa del DOM
- Clase condicional: `${showReservationModal ? 'hidden z-0' : 'flex z-10'}`
- Ya no hay problema de z-index ni se ven encima del modal
- Transición suave con `transition-opacity`

**Mejoras en el sidebar de desktop:**
- Se agregaron los botones de WhatsApp en el sidebar de desktop
- Posición: Justo debajo del botón de reserva y del texto "No se cobra nada hasta confirmar"
- Separados por una línea horizontal (`<hr className="border-stone-200 my-4" />`)
- Botones agregados con diseño completo:
  - **Copiar info para WhatsApp**: Con icono Copy y texto completo
  - **Compartir enlace**: Con icono Share2 y texto completo
  - **Guardar en favoritos**: Con icono Heart y texto completo, con estado activo/inactivo
- Diseño: `w-full` con `flex items-center justify-center` para que ocupen todo el ancho
- Padding: `px-4 py-3` para que se vean cómodos y accesibles
- **Ocultos cuando el modal está abierto**: Clase condicional `${showReservationModal ? 'hidden' : ''}` para que no interfieran con el modal de reserva

**Características adicionales:**
- Bloqueo de scroll: El body no hace scroll con modales abiertos
- Secciones clickeables: Huéspedes, Mascotas y Extras abren el modal
- Cálculo correcto: Precio adicional con 1.16 fijo
- Calendario sobre el modal: z-[60] vs z-50

**Archivos modificados:**
- `app/glamping/[id]/GlampingDetailClient.tsx`: Mejoras completas en la experiencia de reserva

### v1.2 — 2026-04-01
**Secciones nuevas en el home con carruseles interactivos:**

**1. Carrusel de Beneficios "¿Por qué reservar glampings en Glamperos?"**
- 6 tarjetas de beneficios con iconos
- Navegación con flechas izquierda/derecha
- 6 indicadores (dots) inferiores clickeables
- Animación suave de 500ms entre slides
- Responsive: 3 tarjetas en desktop (≥1024px), 1 tarjeta en mobile/tablet
- Beneficios incluidos:
  1. Reserva segura y alojamientos verificados
  2. Flexibilidad total para pagar
  3. Habla directamente con tu anfitrión
  4. Soporte inmediato por WhatsApp
  5. Experiencias y servicios personalizados
  6. Un lugar dedicado a Colombia
- Iconos con hover effect (fondo cambia de emerald-50 a brand)
- Dots se expanden (de 8px a 24px) cuando están activos
- Hover effects en botones de navegación (scale 1.1)
- Límites de navegación para no mostrar tarjetas vacías

**2. Carrusel de Categorías "Los 10 glampings más buscados en Colombia"**
- 10 tarjetas con categorías (CABAÑA, CHALET, DOMO repetidas)
- Navegación con flechas izquierda/derecha
- 10 indicadores (dots) inferiores clickeables
- Animación suave de 500ms entre slides
- Responsive: 3 tarjetas en desktop (≥1024px), 1 tarjeta en mobile/tablet
- Imagen del glamping con ID: 69b8b1a4776b87a18af6b6f8 como fondo de las tarjetas
- Placeholder image: fondo general de home cuando no está disponible la imagen del glamping
- Dots se expanden (de 8px a 24px) cuando están activos
- Hover effects en botones (scale 1.1)
- Enlaces a `/glamping/69b8b1a4776b87a18af6b6f8`
- Límites de navegación para no mostrar tarjetas vacías

**3. Carrusel de FAQ "Todo lo que necesitas saber antes de reservar un glamping en Colombia"**
- 4 tarjetas informativas con preguntas frecuentes
- Navegación con flechas izquierda/derecha
- 4 indicadores (dots) inferiores clickeables
- Animación suave de 500ms entre slides
- Responsive: 2 tarjetas en desktop (≥768px), 1 tarjeta en mobile
- Diseño limpio con borde suave y fondo claro (`bg-stone-50`)
- Preguntas incluidas:
  1. ¿Cuánto cuesta un glamping en Colombia?
  2. ¿Qué llevar a un glamping?
  3. ¿Cuál es la mejor zona para hacer glamping?
  4. ¿Es seguro hacer glamping en Colombia?
- Hover effects: borde cambia a color brand y sombra aumenta
- Transición suave de 300ms
- Buena separación entre tarjetas (gap-6)
- Límites de navegación para no mostrar tarjetas vacías

**Componentes nuevos:**
- `components/home/CategoriasCarouselClient.tsx`:
  - Componente de cliente con el carrusel interactivo completo
  - Usa hooks de React (`useState`, `useEffect`)
  - Manejo responsivo de items per view con listener de resize
  - Lógica de navegación (next, prev, goToSlide)
  - Importa iconos ChevronLeft y ChevronRight de lucide-react
- `components/home/CategoriasCarouselServer.tsx`:
  - Wrapper simple de cliente que renderiza CategoriasCarouselClient
  - Diseñado para futura implementación de fallback sin JavaScript
- `components/home/CategoriasCarouselStatic.tsx`:
  - Grid estático de 10 tarjetas para fallback sin JavaScript
  - Disponible para implementar progressive enhancement en el futuro

**Modificaciones en HomeClient.tsx:**
- Agregado hook `useGlamping('69b8b1a4776b87a18af6b6f8')` para obtener imagen del glamping
- Pasado la imagen a `CategoriasCarouselServer` via prop `glampingImage`
- Agregado array `FAQ_ITEMS` con 4 preguntas frecuentes
- Renderizado de la sección de FAQ después del carrusel de categorías

**Archivos nuevos:**
- `components/home/CategoriasCarouselClient.tsx`
- `components/home/CategoriasCarouselServer.tsx`
- `components/home/CategoriasCarouselStatic.tsx`

**Archivos modificados:**
- `app/HomeClient.tsx`: Agregado carrusel de categorías y sección de FAQ

### v1.1 — 2026-04-01
**Mejoras en el diseño del buscador del home (`SearchFilters.tsx`):**
- Reducido el ancho máximo del contenedor del buscador de `max-w-4xl` (896px) a `max-w-3xl` (768px) para mejor proporción en pantallas grandes
- Agregado `justify-center` al contenedor principal para centrar horizontalmente los componentes internos en pantallas grandes
- Eliminado `flex-wrap` que causaba que los elementos se apilaran de forma desordenada
- Implementado anchos porcentuales fijos para cada sección del buscador:
  - Ubicación: 30% con min-width de 180px
  - Fechas: 25% con min-width de 150px
  - Viajeros: 25% con min-width de 130px
  - Botón buscar: 44px fijo
- Agregadas ciudades sugeridas por defecto (Bogotá y Medellín) cuando se abre el panel de ubicación en desktop
  - Las ciudades sugeridas solo se ocultan cuando el usuario escribe más de 2 caracteres para buscar
  - Cada ciudad sugerida muestra su icono y departamento correspondiente
- Aplicado color `text-brand` (#0D261B, el mismo verde del navbar) a todos los iconos del buscador:
  - MapPin (ubicación)
  - Calendar (fechas)
  - Users (viajeros)
  - Search (botón de búsqueda)
- Corregido problema de desbordamiento del calendario en pantallas grandes:
  - Reducido el ancho del panel de fechas de `580px` a `530px` en desktop
  - Reducido el min-width de cada mes de `260px` a `240px` para mejor ajuste
- Corregidos errores de TypeScript y sintaxis en el componente

**Archivos modificados:**
- `app/HomeClient.tsx`: Reducción del ancho máximo del contenedor del buscador
- `components/home/SearchFilters.tsx`: Mejoras de diseño, ciudades sugeridas, color de iconos, y corrección del calendario

### v1.0 — 2026-03-17
- Home con buscador tipo Airbnb (paneles por sección, estado local, API solo en "Buscar")
- URLs SEO limpias con catch-all route `[...slug]`
- Búsqueda por radio geográfico 130 km para cualquier ciudad
- Catálogo de ~1100 ciudades colombianas con slugs inteligentes
- `norm()` maneja acentos y puntuación ("Bogotá D.C." → "bogota dc")
- Slug de Bogotá: `/bogota` (no `/bogota-bogota-dc`)
- `CalendarioRango`: dos meses lado a lado, selección de rango con hover
- Hook `useGlampings` omite `ciudad` cuando hay coordenadas (radio search)
- Formulario de reserva: 2 huéspedes por defecto
- Integración Wompi para pagos en línea
