# Glamperos Frontend — Documentación Técnica

Plataforma de reservas de glamping para Colombia. Frontend construido con **Next.js 16 + Tailwind CSS + TanStack Query + Zustand**.

---

## Índice

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Estructura de Archivos](#2-estructura-de-archivos)
3. [Variables de Entorno](#3-variables-de-entorno)
4. [Arrancar el Proyecto](#4-arrancar-el-proyecto)
5. [Autenticación y Roles](#5-autenticación-y-roles)
6. [Rutas de la Aplicación](#6-rutas-de-la-aplicación)
7. [Flujo de Creación de Glamping](#7-flujo-de-creación-de-glamping)
8. [Flujo de Aprobación Admin](#8-flujo-de-aprobación-admin)
9. [Componentes UI Reutilizables](#9-componentes-ui-reutilizables)
10. [Librerías de Datos](#10-librerías-de-datos)
11. [Comisiones y Precios](#11-comisiones-y-precios)
12. [Convenciones de Código](#12-convenciones-de-código)
13. [Changelog](#13-changelog)

---

## 1. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Next.js 16.1.6 (App Router, Turbopack) |
| Estilos | Tailwind CSS v4 |
| Estado global | Zustand (con `persist` en localStorage) |
| Fetching / caché | TanStack Query v5 |
| Formularios | React Hook Form v7 |
| Mapas | Google Maps (`@react-google-maps/api`) |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Notificaciones | `react-hot-toast` |
| Íconos | `lucide-react` + `react-icons` |
| HTTP | Axios (`lib/api.ts`) |
| Pagos | Widget Wompi (script embebido) |

---

## 2. Estructura de Archivos

```
frontglamperos2026/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                  # Layout admin (solo rol=admin)
│   │   ├── page.tsx                    # Dashboard admin
│   │   ├── aprobaciones/page.tsx       # Aprobar/rechazar glampings pendientes
│   │   ├── glampings/page.tsx          # Gestión de glampings
│   │   ├── reservas/page.tsx           # Gestión de reservas
│   │   ├── usuarios/page.tsx           # Gestión de usuarios
│   │   └── comentarios/page.tsx        # Comentarios plataforma
│   ├── anfitrion/
│   │   ├── layout.tsx                  # Protege rutas (requiere auth + hydration)
│   │   ├── page.tsx                    # Dashboard anfitrión
│   │   ├── glampings/
│   │   │   ├── page.tsx                # Lista mis glampings con badges de estado
│   │   │   ├── nuevo/page.tsx          # Formulario creación glamping (3 pasos)
│   │   │   └── [id]/page.tsx           # Editar glamping existente
│   │   └── calendario/                 # Gestión de disponibilidad
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── glamping/
│   │   └── [id]/
│   │       ├── page.tsx                # Server Component (SEO)
│   │       ├── GlampingDetailClient.tsx # Detalle interactivo
│   │       └── reservar/page.tsx       # Flujo de reserva
│   ├── perfil/page.tsx                 # Perfil + medios de pago (anfitriones)
│   └── layout.tsx                      # Root layout
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx / Textarea.tsx
│       ├── Skeleton.tsx                # Placeholder animado de carga
│       ├── Spinner.tsx
│       ├── CiudadAutocomplete.tsx      # Selector municipios Colombia
│       ├── FotosUpload.tsx             # Upload con drag & drop, máx 30 fotos
│       └── MapaPicker.tsx              # Google Maps + Places Autocomplete
├── hooks/
│   ├── useAuth.ts
│   └── useGlampings.ts
├── lib/
│   ├── api.ts                          # Instancia Axios con baseURL y token
│   ├── utils.ts                        # formatCOP, toTitleCase, amenidadIconos…
│   ├── colombia.ts                     # ~300 municipios colombianos
│   └── catalogoExtras.ts              # 24 servicios extras con unidad y label
├── store/
│   └── authStore.ts                    # Zustand: user, token, isAuthenticated
└── types/
    └── index.ts                        # Interfaces TypeScript (Glamping, Reserva…)
```

---

## 3. Variables de Entorno

Archivo: `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSy...          # Google Maps + Places API
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...               # Google OAuth
```

---

## 4. Arrancar el Proyecto

```bash
npm install
npm run dev       # http://localhost:3000 (Turbopack)
npm run build
npm run start
```

> **Turbopack** está activo por defecto en Next.js 16. No usar configuración `webpack` en `next.config.ts` — usar `turbopack: {}` en su lugar.

---

## 5. Autenticación y Roles

### Zustand store

```ts
const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore()
```

Estado persistido en `localStorage` con `zustand/middleware/persist`.

**Problema de hidratación:** En layouts protegidos, el estado de Zustand no está disponible en el primer render. Siempre usar el patrón:

```tsx
const [hydrated, setHydrated] = useState(false)
useEffect(() => setHydrated(true), [])
if (!hydrated || !isAuthenticated) return null
```

### Roles

| Rol | Acceso |
|---|---|
| `usuario` | Buscar, reservar, favoritos |
| `anfitrion` | Todo lo anterior + gestionar glampings |
| `admin` | Acceso total + panel admin |

Un usuario se promueve a `anfitrion` automáticamente al crear su primer glamping (lo hace el backend).

---

## 6. Rutas de la Aplicación

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Home con listado (SSR) | Público |
| `/[ciudad]/[tipo]/[amenidad]` | Home filtrado con URL semántica (SSR) | Público |
| `/glamping/[id]` | Detalle del glamping | Público |
| `/glamping/[id]/reservar` | Flujo de reserva | Autenticado |
| `/propiedad/[id]` | Alias de `/glamping/[id]` (UTMs Google Ads) | Público |
| `/favoritos` | Mis glampings guardados | Autenticado |
| `/auth/login` | Inicio de sesión | Público |
| `/auth/registro` | Registro | Público |
| `/perfil` | Mi perfil + medios de pago | Autenticado |
| `/anfitrion` | Dashboard anfitrión | `anfitrion` o `admin` |
| `/anfitrion/glampings` | Lista mis glampings | `anfitrion` o `admin` |
| `/anfitrion/glampings/nuevo` | Crear glamping (3 pasos) | `anfitrion` o `admin` |
| `/anfitrion/glampings/[id]` | Editar glamping | Propietario o `admin` |
| `/admin` | Dashboard admin | `admin` |
| `/admin/aprobaciones` | Aprobar/rechazar glampings | `admin` |
| `/admin/reservas` | Gestión de reservas | `admin` |
| `/admin/glampings` | Gestión de glampings | `admin` |
| `/admin/usuarios` | Gestión de usuarios | `admin` |

---

## 7. Flujo de Creación de Glamping

El formulario en `/anfitrion/glampings/nuevo` tiene **3 pasos** con borrador automático.

### Paso 1 — Información básica

Campos requeridos para avanzar:
- `tipoGlamping` — chips con íconos
- `nombreGlamping` — nombre de la unidad
- `descripcionGlamping`
- `ciudadDepartamento` — autocomplete con municipios de Colombia
- `precioNoche` — debe ser > 0

Campos opcionales:
- `nombrePropiedad` — nombre del establecimiento
- `cantidadHuespedes`, `cantidadHuespedesAdicionales`
- `precioPersonaAdicional` — solo editable si `cantidadHuespedesAdicionales > 0`
- `minimoNoches`, `checkInNoche`, `checkOutNoche`
- `aceptaMascotas` → si activo, muestra `precioMascotas` (puede ser 0)
- `permitePasadia` → si activo, muestra horarios de entrada/salida
- **Tarifas por día** — acordeón habilitado solo si `precioNoche > 0`:
  - `tarifasNoche` — objeto `{ lunes, martes, ..., domingo }` (0 = usa precio base)
  - `tarifasPasadia` — igual, solo visible si `permitePasadia = true`

### Paso 2 — Ubicación y fotos

- **Fotos** — mínimo 5, máximo 30; drag & drop para reordenar; primera foto = portada
- **Mapa** — Google Maps con búsqueda inteligente por nombre; click para colocar; marcador arrastrable
- `direccion` — referencia textual

### Paso 3 — Amenidades y políticas

- **Amenidades** — 51 opciones del catálogo oficial
- **Servicios extras** — 24 servicios; al activar cada uno: precio COP + unidad (por persona / por pareja)
- **Política de cancelación** — "No admite cancelaciones" o número de días de anticipación
- **Políticas de la casa** — texto libre

### Borrador y auto-guardado

- Borrador creado al avanzar del paso 1 (requiere `nombreGlamping` + `tipoGlamping`)
- Auto-guardado cada **30 segundos** si hay cambios
- Botón flotante **"Guardar ahora"** — guarda datos + sube fotos pendientes
- Al recargar: el borrador se restaura automáticamente (datos, fotos, ubicación, extras)

### Navegación entre pasos

El stepper es **clickeable** tras desbloquear cada paso:
- Click hacia atrás → navegación directa
- Click hacia adelante → misma validación que "Siguiente"

### Estado tras publicar

Al publicar, el glamping queda en `estadoAprobacion = "pendiente"`. Un admin debe aprobarlo desde `/admin/aprobaciones` para que sea visible en el catálogo.

---

## 8. Flujo de Aprobación Admin

### Estados de un glamping

| `estadoAprobacion` | `habilitado` | Visible en catálogo |
|---|---|---|
| `null` / borrador | `false` | No |
| `"pendiente"` | `false` | No |
| `"aprobado"` | `true` | Sí |
| `"rechazado"` | `false` | No |

### Panel `/admin/aprobaciones`

- Lista glampings pendientes con foto, nombre, ciudad, precio, número de fotos y descripción
- **Aprobar** → `POST /glampings/{id}/aprobar`
- **Rechazar** → campo de motivo + `POST /glampings/{id}/rechazar?motivo=...`
- El motivo aparece en el dashboard del anfitrión

---

## 9. Componentes UI Reutilizables

### `FotosUpload`

```tsx
import { FotosUpload, type ImagenItem } from '@/components/ui/FotosUpload'
// ImagenItem = File | string (URL ya guardada)
<FotosUpload imagenes={imagenes} onChange={setImagenes} />
```

- Drag & drop con `@dnd-kit`
- Mínimo 5, máximo 30 fotos
- Badge `✓` en fotos ya guardadas en GCS
- Indicador dinámico: "faltan X fotos" / "X pendientes de guardar"

### `MapaPicker`

```tsx
// Importar siempre con dynamic + ssr: false
const MapaPicker = dynamic(() => import('@/components/ui/MapaPicker').then(m => m.MapaPicker), { ssr: false })

<MapaPicker lat={lat} lng={lng} onChange={(lat, lng) => setUbicacion({ lat, lng })} />
```

- Requiere `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- Autocomplete restringido a Colombia
- Import dinámico obligatorio (depende de `window`)

### `CiudadAutocomplete`

```tsx
<CiudadAutocomplete
  value={watch('ciudadDepartamento') || ''}
  onChange={(val) => setValue('ciudadDepartamento', val, { shouldDirty: true })}
/>
```

Filtra `lib/colombia.ts` desde 2 caracteres, máximo 8 resultados.

### `Skeleton`

```tsx
<Skeleton className="h-10 w-full" />
```

### Ubicación en detalle del glamping

El mapa de detalle muestra zoom 11 (nivel municipio) **sin marcador exacto** hasta que el usuario reserve. Overlay: *"La ubicación exacta se comparte al confirmar tu reserva"*.

---

## 10. Librerías de Datos

### `lib/colombia.ts`

~300 municipios en formato `"Municipio, Departamento"`. Cobertura completa de los 32 departamentos con énfasis en Cundinamarca y Antioquia.

### `lib/catalogoExtras.ts`

```ts
interface CatalogoExtra {
  key: string
  nombre: string
  unidad: 'por_persona' | 'por_pareja'
}
```

24 servicios: cabalgata, jacuzzi privado, masajes, mascota adicional, cena romántica, decoración sencilla/especial, picnic, noche de película, descorche, paseos (lancha, bicicleta, kayak, velero, jet ski), caminata guiada, cuatrimoto, parapente, masaje individual, desayuno, almuerzo, tours 1/2/3.

> "Persona adicional" no está en el catálogo — se maneja con `precioPersonaAdicional` en el paso 1.

---

## 11. Comisiones y Precios

El frontend **nunca calcula comisiones** — usa la cotización del backend (`GET /glampings/{id}/cotizar`). Los precios devueltos ya incluyen la comisión.

| Servicio | Comisión (referencia) |
|---|---|
| Alojamiento | Escalonada 10%–20% según precio |
| Extras (todos excepto jacuzzi) | Flat 10% |
| Jacuzzi | Misma comisión escalonada que alojamiento |
| Pago online (Wompi) | +5% sobre el total |

---

## 12. Convenciones de Código

- **camelCase** en todos los campos de API y formularios
- `toTitleCase()` aplicado a nombres antes de enviar al backend
- Payload filtrado antes de PUT: eliminar strings vacíos, `undefined` y `null`
- Mapas siempre con `dynamic(..., { ssr: false })`
- `'use client'` en todos los componentes interactivos
- Patrón `hydrated` en layouts protegidos para evitar redirect prematuro
- Imágenes `(File | string)[]`: subir al guardar/avanzar, no solo al publicar

---

## 13. Changelog

### v2.7 — 2026-03-17

#### Home — filtros rápidos y URLs SEO-friendly

- Chips de filtro hardcodeados (sin llamada a API): domo, cabaña, chalet, tiny\_house, tipi, jacuzzi, piscina, Bogotá, Medellín
- Cada chip usa `TipoGlampingIcon` (SVGs desde GCS) para íconos de tipos
- URL semántica al filtrar: `/medellin/domo`, `/bogota/jacuzzi`, `/domo`, etc.
- Jerarquía ciudad → tipo → amenidad siempre respetada
- Chips de ciudad envían `radio_km: 100` al backend; geolocalización automática no lo hace (muestra todos los glampings)
- Chip "Todos" usa `resetFiltros()` para garantizar cache hit en TanStack Query

#### Rutas SEO con `[...slug]`

- `app/[...slug]/page.tsx` — catch-all server component
- Parsea segmentos de URL → `Partial<FiltrosHome>` via `buildFiltrosFromSlug()`
- Genera `<title>` y `<meta description>` dinámica con `generateMetadata` + `buildSeoMeta()`
- SSR: fetch de datos en servidor → prop `serverData` → los bots ven el HTML completo con las tarjetas
- `lib/filtros.ts` — catálogos `FILTROS_CIUDADES`, `FILTROS_TIPOS`, `FILTROS_AMENIDADES` + helpers `buildFiltrosFromSlug`, `buildSlugFromFiltros`, `buildUrlFromFiltros`, `buildSeoMeta`, `fetchGlampingsSSR`

#### URLs `/propiedad/:id` para campañas Google Ads

- `next.config.ts` — `rewrites()` mapea `/propiedad/:id` → `/glamping/:id` sin cambiar la URL del navegador
- UTM params y `gclid` se preservan (rewrites, no redirects)
- También cubre `/propiedad/:id/fotos` y `/propiedad/:id/reservar`
- Cache headers `s-maxage=300` para `/propiedad/:id`

#### `GlampingCard` — rediseño

- Eliminado badge de tipo de alojamiento sobre la imagen
- Corazón de favoritos siempre visible (antes solo para autenticados)
- Click en corazón sin sesión → `toast.error('Inicia sesión para guardar en favoritos')`
- Fila inferior muestra precio + badge "☕ Con desayuno" / "Sin desayuno" según amenidad `incluye-desayuno`

#### Página `/favoritos`

- Corregido: `router.push('/auth/login')` dentro del render causaba warning de React
- Fix: movido a `useEffect([isAuthenticated])` para no mutar estado durante el render

#### SSR + TanStack Query

- `HomeClient.tsx` — prop `serverData` como fallback: `data = queryData ?? serverData`
- Query solo se activa cuando `ready = true` (después de sincronizar filtros desde URL)
- `placeholderData: keepPreviousData` evita flash de estado vacío entre cambios de filtro
- `enabled` param en `useGlampingsHome` para controlar activación externa

#### Nuevas rutas

| Ruta | Descripción |
|---|---|
| `/[...slug]` | Home con filtros via URL (SSR) |
| `/propiedad/[id]` | Alias de `/glamping/[id]` para UTMs |
| `/favoritos` | Mis glampings guardados |

---

### v2.6 — 2026-03-16

#### Formulario de creación `/anfitrion/glampings/nuevo`
- Skeleton loading en lugar de spinner
- Stepper clickeable entre pasos desbloqueados
- Validación de campos requeridos antes de avanzar del paso 1
- Borrador automático + botón flotante "Guardar ahora"
- `precioPersonaAdicional` deshabilitado si `cantidadHuespedesAdicionales = 0`
- `precioMascotas` solo visible cuando `aceptaMascotas = true`
- Horarios pasadía solo visibles cuando `permitePasadia = true`
- Tarifas por día en acordeón, deshabilitadas si precio base = 0
- Política de cancelación con opción "No admite cancelaciones"
- `CiudadAutocomplete` con ~300 municipios de Colombia
- `FotosUpload`: drag & drop, mín 5 fotos, máx 30, estado mixto `File | string`
- `MapaPicker` con Google Maps + Places Autocomplete restringido a Colombia
- Imágenes se guardan al clic en "Guardar" o al avanzar de paso
- 51 amenidades validadas contra catálogo del backend
- 24 servicios extras con precio y selector de unidad (por persona / por pareja)
- Al publicar: glamping queda en `pendiente`, no se publica directamente

#### Panel admin `/admin/aprobaciones` — nuevo
- Lista glampings pendientes con foto, datos y descripción
- Aprobar → publicación inmediata
- Rechazar → campo de motivo opcional
- "Aprobaciones" en sidebar del admin con ícono `ShieldCheck`

#### Lista de glampings `/anfitrion/glampings` — nueva página
- Antes daba 404 (no existía `page.tsx`)
- Grid con foto, nombre, ciudad, precio, calificación
- Badges de estado: En revisión / Publicado / Rechazado
- Motivo de rechazo visible en la tarjeta
- Query: `GET /usuarios/me/glampings` (endpoint nuevo en backend)
- Filtra borradores no enviados a revisión en cliente

#### Detalle anfitrión `/anfitrion/glampings/[id]` — nueva página
- Antes daba 404 (no existía `page.tsx` en la carpeta `[id]/`)
- Banner de estado: En revisión / Publicado / Rechazado con descripción contextual
- Motivo de rechazo si aplica
- Foto portada + datos básicos (tipo, ciudad, precio, descripción)
- Botón "Ver página pública" solo visible si `habilitado: true`
- Requiere que el backend permita acceso del propietario (`es_propietario` check)

#### Detalle del glamping `/glamping/[id]`
- Mapa en zoom 11 sin marcador exacto
- Mensaje: "La ubicación exacta se comparte al confirmar tu reserva"

#### Perfil `/perfil`
- Sección "Medios de pago" para anfitriones y admins
- Documento de identidad obligatorio (CC / CE / NIT / Pasaporte + número + titular)
- Nequi y Daviplata (número de celular)
- Cuenta bancaria (banco, número, tipo)
