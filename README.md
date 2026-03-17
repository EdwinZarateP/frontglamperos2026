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
7. [Layouts y Navegación](#7-layouts-y-navegación)
8. [Flujo de Creación de Glamping](#8-flujo-de-creación-de-glamping)
9. [Panel Anfitrión](#9-panel-anfitrión)
10. [Panel Admin](#10-panel-admin)
11. [Flujo de Aprobación](#11-flujo-de-aprobación)
12. [Componentes UI Reutilizables](#12-componentes-ui-reutilizables)
13. [Librerías de Datos](#13-librerías-de-datos)
14. [Comisiones y Precios](#14-comisiones-y-precios)
15. [Convenciones de Código](#15-convenciones-de-código)
16. [Changelog](#16-changelog)

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
| HTTP | Axios (`lib/api.ts`, timeout 30s) |
| Pagos | Widget Wompi (script embebido) |

---

## 2. Estructura de Archivos

```
frontglamperos2026/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                  # Sidebar oscuro, solo rol=admin
│   │   ├── page.tsx                    # Dashboard admin (stats + accesos rápidos)
│   │   ├── aprobaciones/page.tsx       # Aprobar/rechazar glampings pendientes
│   │   ├── glampings/page.tsx          # Tabla de glampings + cambio de estado + gestión de anfitriones
│   │   ├── reservas/page.tsx           # Gestión de reservas
│   │   ├── usuarios/page.tsx           # Gestión de usuarios con modal de edición completo
│   │   └── comentarios/page.tsx        # Comentarios plataforma (filtro, marcar leído, eliminar)
│   ├── anfitrion/
│   │   ├── layout.tsx                  # Sidebar blanco, requiere auth + hydration
│   │   ├── page.tsx                    # Dashboard anfitrión (glampings + ingresos + calificación)
│   │   ├── glampings/
│   │   │   ├── page.tsx                # Lista mis glampings con badges de estado
│   │   │   ├── nuevo/page.tsx          # Formulario creación glamping (3 pasos)
│   │   │   └── [id]/page.tsx           # Editar glamping existente
│   │   ├── reservas/page.tsx           # Reservas por glamping con filtro de estado
│   │   └── calendario/page.tsx         # Calendario de disponibilidad + bloqueos + ocupación
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── registro/page.tsx
│   ├── glamping/
│   │   └── [id]/
│   │       ├── page.tsx                # Server Component (SEO)
│   │       ├── GlampingDetailClient.tsx # Detalle interactivo
│   │       └── reservar/page.tsx       # Flujo de reserva
│   ├── perfil/page.tsx                 # Perfil + medios de pago (anfitriones/admin)
│   ├── favoritos/page.tsx              # Glampings guardados
│   ├── providers.tsx                   # QueryClient + Toaster
│   └── layout.tsx                      # Root layout → usa ConditionalLayout
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                  # Header público con logo + menú usuario
│   │   ├── Footer.tsx                  # Footer del sitio público
│   │   └── ConditionalLayout.tsx       # Oculta Navbar en /admin; oculta Footer en /admin y /anfitrion
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx / Textarea.tsx
│       ├── Skeleton.tsx
│       ├── Spinner.tsx
│       ├── CiudadAutocomplete.tsx
│       ├── FotosUpload.tsx
│       ├── MapaPicker.tsx
│       └── TipoGlampingIcon.tsx
├── hooks/
│   ├── useAuth.ts                      # useMe, useLogout
│   └── useGlampings.ts                 # useGlampingsHome, useTiposGlamping
├── lib/
│   ├── api.ts                          # Axios con baseURL, token JWT, interceptor 401
│   ├── utils.ts                        # formatCOP, toTitleCase, tipoGlampingLabels, amenidadIconos…
│   ├── colombia.ts                     # ~300 municipios colombianos
│   ├── catalogoExtras.ts              # 24 servicios extras con unidad y label
│   └── filtros.ts                      # Helpers para URLs semánticas (SSR)
├── store/
│   └── authStore.ts                    # Zustand: user, token, isAuthenticated, updateUser
└── types/
    └── index.ts                        # Interfaces TypeScript (Glamping, Reserva…)
```

---

## 3. Variables de Entorno

Archivo: `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
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

> **Turbopack** está activo por defecto en Next.js 16. No usar configuración `webpack` en `next.config.ts`.

---

## 5. Autenticación y Roles

### Zustand store

```ts
const { user, token, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore()
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
| `anfitrion` | Todo lo anterior + gestionar glampings + panel anfitrión |
| `admin` | Acceso total + panel admin + panel anfitrión |

Un usuario se promueve a `anfitrion` automáticamente al crear su primer glamping o al ser asignado a uno por un admin.

---

## 6. Rutas de la Aplicación

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Home con listado (SSR) | Público |
| `/[...slug]` | Home filtrado con URL semántica (SSR) | Público |
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
| `/anfitrion/reservas` | Ver reservas por glamping | `anfitrion` o `admin` |
| `/anfitrion/calendario` | Calendario de disponibilidad | `anfitrion` o `admin` |
| `/admin` | Dashboard admin | `admin` |
| `/admin/aprobaciones` | Aprobar/rechazar glampings pendientes | `admin` |
| `/admin/reservas` | Gestión de reservas | `admin` |
| `/admin/glampings` | Gestión de glampings | `admin` |
| `/admin/usuarios` | Gestión de usuarios | `admin` |
| `/admin/comentarios` | Comentarios plataforma | `admin` |

---

## 7. Layouts y Navegación

### ConditionalLayout

El componente `components/layout/ConditionalLayout.tsx` controla qué elementos globales se muestran según la ruta:

```ts
const NO_NAVBAR = ['/admin']            // Admin tiene su propio sidebar oscuro
const NO_FOOTER = ['/admin', '/anfitrion'] // Paneles no muestran el footer del sitio
```

- `/admin/*` → sin Navbar ni Footer (solo sidebar oscuro propio)
- `/anfitrion/*` → con Navbar de Glamperos (logo + menú usuario) pero sin Footer
- Todo lo demás → Navbar + Footer completos

### Navbar en el panel anfitrión

El anfitrión siempre ve el Navbar de Glamperos en la parte superior con el logo y el botón de perfil/logout, lo que permite navegar al inicio en cualquier momento.

### Hydration warnings

- `<body suppressHydrationWarning>` — Grammarly inyecta `cz-shortcut-listen`
- `<header suppressHydrationWarning>` en Navbar — Next.js dev toolbar inyecta `style={{top:"calc(36px)"}}`

---

## 8. Flujo de Creación de Glamping

El formulario en `/anfitrion/glampings/nuevo` tiene **3 pasos** con borrador automático.

### Asignación de propietario (solo admin)

Al inicio del paso 1, los admins ven un bloque amarillo **"Asignar a anfitrión"** con buscador de usuarios. Si seleccionan a alguien, al crear el borrador se transfiere inmediatamente la propiedad vía `PUT /glampings/{id}/propietario`. Si no seleccionan a nadie, el glamping queda asignado al admin.

### Paso 1 — Información básica

Campos requeridos para avanzar:
- `tipoGlamping`, `nombreGlamping`, `descripcionGlamping`, `ciudadDepartamento`, `precioNoche > 0`

Campos opcionales: `nombrePropiedad`, huéspedes, precios adicionales, horarios, mascotas, pasadía, tarifas por día de semana.

### Paso 2 — Ubicación y fotos

- **Fotos** — mínimo 5, máximo 30; drag & drop para reordenar; primera = portada
- **Mapa** — Google Maps con búsqueda inteligente; click para colocar; marcador arrastrable
- `direccion` — referencia textual

### Paso 3 — Amenidades y políticas

- 51 amenidades del catálogo oficial
- 24 servicios extras con precio y unidad (por persona / por pareja)
- Política de cancelación + políticas de la casa

### Borrador y auto-guardado

- Borrador creado al avanzar del paso 1
- Auto-guardado cada 30 segundos si hay cambios
- Botón flotante **"Guardar ahora"**
- Al recargar: borrador restaurado automáticamente

### Estado tras publicar

`estadoAprobacion = "pendiente"`. El admin aprueba desde `/admin/aprobaciones`.

---

## 9. Panel Anfitrión

### Dashboard `/anfitrion`

- **Mis glampings** — cantidad de glampings del anfitrión
- **Ingresos mes** — suma de `precioTotal` de reservas CONFIRMADA/COMPLETADA del mes actual (solo reservas Glamperos)
- **Calificación** — promedio
- Acceso rápido: **Ver calendario**

Los ingresos se calculan en frontend usando `useQueries` para obtener reservas de cada glamping en paralelo vía `GET /reservas/glamping/{id}`.

### Calendario `/anfitrion/calendario`

- Vista mensual con color por glamping
- **Bloqueo de fechas**: selector de glamping disponible (deshabilitado si ya está completamente bloqueado en el rango)
- **Desbloqueo**: lista de bloqueos del mes actual; solo los manuales (`fuente === 'MANUAL'`) tienen ícono de papelera
- **Ocupación**: pills de porcentaje por glamping, calculado sobre todas las fuentes (manual, Airbnb, Booking, Glamperos)

### Mis reservas `/anfitrion/reservas`

- Lista de reservas por glamping
- Filtro por estado (PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA)
- Cambio de estado por reserva

---

## 10. Panel Admin

### Dashboard `/admin`

- Cards: Glampings activos, Usuarios registrados
- Accesos rápidos: reservas, glampings, usuarios, comentarios (usan `<Link>` para navegación client-side sin resetear Zustand)

### Gestión de Glampings `/admin/glampings`

- Tabla con: foto, nombre glamping, establecimiento, ubicación, precio, estado
- **Estado inline**: `<select>` que llama `PUT /glampings/{id}/estado` al cambiar; colores por estado:
  - `pendiente` → amber
  - `aprobado` → verde
  - `rechazado` → rojo
  - `inactivo` → gris
- **Botón 👥 Anfitriones**: modal que muestra todos los anfitriones del glamping con opción de añadir co-anfitriones (buscador por nombre/email) o eliminarlos. El propietario principal muestra badge "Principal" y no se puede eliminar desde aquí.
- **Botón + Crear glamping**: lleva a `/anfitrion/glampings/nuevo`
- **Botón Excel**: descarga CSV con datos del glamping + datos del propietario (nombre, email, teléfono)

#### Estados de un glamping

| `estadoAprobacion` | `habilitado` | Visible en catálogo |
|---|---|---|
| `"pendiente"` | `false` | No — esperando revisión |
| `"aprobado"` | `true` | Sí |
| `"rechazado"` | `false` | No — el anfitrión debe corregir |
| `"inactivo"` | `false` | No — pausado temporalmente |

### Gestión de Usuarios `/admin/usuarios`

- Lista de usuarios con rol, estado de verificación y foto
- Modal de edición con:
  - **Datos personales**: nombre, teléfono (selector de indicativo con 10 países)
  - **Rol**: usuario / anfitrión / admin
  - **Medios de pago** (solo si rol es anfitrión o admin): tipo/número de documento, titular, banco (dropdown con 17 opciones), número de cuenta, tipo de cuenta
  - **Asignar glamping**: selecciona de los glampings del admin para transferir propiedad

### Comentarios `/admin/comentarios`

- Lista con filtro por tipo (sugerencia/queja/felicitación/otro) y estado (pendiente/leído)
- Toggle leído/no leído con ícono de sobre
- Eliminar comentario
- Los leídos aparecen con `opacity-60`

---

## 11. Flujo de Aprobación

### Panel `/admin/aprobaciones`

- Lista glampings pendientes
- **Aprobar** → `POST /glampings/{id}/aprobar`
- **Rechazar** → campo de motivo + `POST /glampings/{id}/rechazar?motivo=...`
- El motivo aparece en el dashboard del anfitrión

### Cambio de estado desde tabla

Desde `/admin/glampings`, el `<select>` de estado llama a `PUT /glampings/{id}/estado?estado=` que acepta: `pendiente | aprobado | rechazado | inactivo`.

---

## 12. Componentes UI Reutilizables

### `FotosUpload`

```tsx
import { FotosUpload, type ImagenItem } from '@/components/ui/FotosUpload'
// ImagenItem = File | string (URL ya guardada)
<FotosUpload imagenes={imagenes} onChange={setImagenes} />
```

### `MapaPicker`

```tsx
// Siempre con dynamic + ssr: false
const MapaPicker = dynamic(() => import('@/components/ui/MapaPicker').then(m => m.MapaPicker), { ssr: false })
<MapaPicker lat={lat} lng={lng} onChange={(lat, lng) => setUbicacion({ lat, lng })} />
```

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

---

## 13. Librerías de Datos

### `lib/colombia.ts`

~300 municipios en formato `"Municipio, Departamento"`.

### `lib/catalogoExtras.ts`

24 servicios: cabalgata, jacuzzi privado, masajes, cena romántica, decoración, picnic, noche de película, descorche, paseos (lancha, bicicleta, kayak, velero, jet ski), caminata guiada, cuatrimoto, parapente, masaje individual, desayuno, almuerzo, tours.

### `lib/filtros.ts`

Catálogos y helpers para URLs semánticas: `buildFiltrosFromSlug`, `buildSlugFromFiltros`, `buildUrlFromFiltros`, `buildSeoMeta`, `fetchGlampingsSSR`.

---

## 14. Comisiones y Precios

El frontend **nunca calcula comisiones** — usa la cotización del backend (`GET /glampings/{id}/cotizar`).

| Servicio | Comisión |
|---|---|
| Alojamiento | Escalonada 10%–20% según precio |
| Extras (excepto jacuzzi) | Flat 10% |
| Jacuzzi | Misma comisión escalonada que alojamiento |
| Pago online (Wompi) | +5% sobre el total |

---

## 15. Convenciones de Código

- **camelCase** en todos los campos de API y formularios
- `toTitleCase()` aplicado a nombres antes de enviar al backend
- Payload filtrado antes de PUT: eliminar strings vacíos, `undefined` y `null`
- Mapas siempre con `dynamic(..., { ssr: false })`
- `'use client'` en todos los componentes interactivos
- Patrón `hydrated` en layouts protegidos para evitar redirect prematuro
- `<Link>` (nunca `<a href>`) para navegación interna — `<a>` causa recarga completa y borra el estado de Zustand
- Los IDs de MongoDB llegan como `id` (no `_id`) desde la API (Pydantic `Field(alias="_id")` serializa como `id`)

---

## 16. Changelog

### v2.8 — 2026-03-17

#### Panel Admin — mejoras completas

**Glampings (`/admin/glampings`)**
- Estado de glamping cambiable inline con `<select>` coloreado (pendiente/aprobado/rechazado/inactivo)
- Modal 👥 de gestión de co-anfitriones: listar, añadir (buscador de usuarios), eliminar
- Botón "+ Crear glamping" que lleva a `/anfitrion/glampings/nuevo`
- Excel corregido: `model_dump(by_alias=True)` para que `_id` llegue bien al CSV; `find_by_id` en lugar de `get_by_id`

**Usuarios (`/admin/usuarios`)**
- Modal de edición completo: nombre, teléfono con selector de indicativo (+57 Colombia por defecto), rol, medios de pago (solo si rol = anfitrión/admin), asignar glamping
- Medios de pago: banco como dropdown (17 opciones), tipo/número de documento, titular, número y tipo de cuenta
- Sección de medios de pago visible dinámicamente al cambiar rol en el propio modal

**Comentarios (`/admin/comentarios`)** — nueva página
- Filtros por tipo y estado
- Toggle leído/no leído, eliminar comentario

**Dashboard (`/admin`)** — correcciones
- `glampings.length` (el endpoint devuelve array, no `{total}`)
- Accesos rápidos cambiados de `<a>` a `<Link>` (evitaba reset de Zustand)

#### Panel Anfitrión — mejoras

**Dashboard**
- Solo 3 cards: Mis glampings, Ingresos mes (solo reservas Glamperos), Calificación
- Eliminados: "Reservas recientes", acceso rápido "Mis reservas", botón "+ Publicar"
- Ingresos calculados con `useQueries` paralelos por glamping

**Calendario**
- Prevención de doble bloqueo: glampings completamente bloqueados aparecen deshabilitados con badge "Ya bloqueado"
- Auto-selección de glamping si solo hay uno disponible
- Lista de bloqueos del mes con fechas formateadas (ej: "19 mar 2026") y tipo (☀️ Pasadía / 🌙 Noches)
- Botón eliminar solo en bloqueos manuales (`fuente === 'MANUAL'`)
- Pills de ocupación % por glamping (incluye todas las fuentes: Airbnb, Booking, manual, Glamperos)

#### Formulario creación glamping

- **Selector de propietario** (solo admin): bloque amber al inicio del paso 1 con buscador de usuarios; al crear borrador, transfiere propiedad automáticamente si se seleccionó alguien

#### Layout global

- `ConditionalLayout` en `app/layout.tsx`: oculta Navbar para `/admin/*`, oculta Footer para `/admin/*` y `/anfitrion/*`
- Panel anfitrión mantiene el Navbar de Glamperos (logo + menú usuario + enlace al inicio)

#### Perfil (`/perfil`)

- Sección medios de pago simplificada: banco como `<select>` con 17 opciones (en lugar de input libre + secciones separadas de Nequi/Daviplata)
- Campos: tipo doc + número doc en grid, titular, banco, cuenta + tipo en grid

#### Correcciones de React

- `key` en listas usaba `r._id` pero la API devuelve `id` → corregido a `r.id`
- `suppressHydrationWarning` en `<body>` (Grammarly) y `<header>` del Navbar (Next.js dev toolbar)

---

### v2.7 — 2026-03-17

#### Home — filtros rápidos y URLs SEO-friendly

- Chips de filtro hardcodeados: domo, cabaña, chalet, tiny_house, tipi, jacuzzi, piscina, Bogotá, Medellín
- URL semántica: `/medellin/domo`, `/bogota/jacuzzi`, etc.
- Chip "Todos" usa `resetFiltros()` para cache hit en TanStack Query

#### Rutas SEO con `[...slug]`

- `app/[...slug]/page.tsx` — catch-all server component
- Genera `<title>` y `<meta description>` dinámica
- SSR: bots ven HTML completo con tarjetas

#### URLs `/propiedad/:id` para Google Ads

- `next.config.ts` rewrites `/propiedad/:id` → `/glamping/:id` preservando UTMs
- Cache `s-maxage=300`

#### GlampingCard — rediseño

- Sin badge de tipo sobre imagen
- Corazón siempre visible; sin sesión → toast de error
- Badge "☕ Con desayuno" según amenidad `incluye-desayuno`

---

### v2.6 — 2026-03-16

#### Formulario creación

- Skeleton loading, stepper clickeable, borrador automático, auto-guardado 30s
- CiudadAutocomplete, FotosUpload, MapaPicker
- 51 amenidades validadas, 24 servicios extras, política de cancelación
- Al publicar: estado `pendiente`

#### Panel admin aprobaciones

- Lista glampings pendientes, aprobar/rechazar con motivo

#### Lista y detalle glampings anfitrión

- `GET /usuarios/me/glampings` — lista con badges de estado y motivo de rechazo
- Detalle con banner contextual por estado, botón "Ver página pública"
