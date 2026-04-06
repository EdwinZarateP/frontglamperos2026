# Glamperos Frontend — CLAUDE.md

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + `cn()` utility
- **Zustand** — auth state (`/store/authStore.ts`)
- **TanStack React Query** — server state, polling
- **Lucide React** — iconos
- **`/lib/api.ts`** — axios instance con JWT token automático

## Estructura de páginas clave

```
app/
  page.tsx                          — home (catálogo glampings con filtros)
  layout.tsx                        — root layout
  providers.tsx                     — QueryClientProvider + AuthHydration

  glamping/[id]/
    page.tsx                        — ISR (revalidate 300s), OG metadata, JSON-LD
    GlampingDetailClient.tsx        — detalle glamping (cliente)
    reservar/page.tsx               — flujo de reserva
    fotos/page.tsx                  — galería completa

  calificaciones/
    valorar/[token]/page.tsx        — página pública de calificación (sin auth)

  comentarios/
    page.tsx                        — formulario público de comentarios/sugerencias

  admin/
    layout.tsx → AdminLayoutClient.tsx
    page.tsx                        — dashboard admin
    aprobaciones/page.tsx
    reservas/page.tsx               — incluye botón "Link calificación" para COMPLETADA
    glampings/page.tsx
    usuarios/page.tsx
    comentarios/page.tsx
    bot/page.tsx                    — panel en tiempo real de conversaciones del bot

  anfitrion/
    layout.tsx → AnfitrionLayoutClient.tsx
    page.tsx
    glampings/page.tsx
    glampings/nuevo/page.tsx
    glampings/[id]/page.tsx
    glampings/[id]/calendario/page.tsx
    reservas/page.tsx               — incluye botón "Generar link calificación" para COMPLETADA
    calendario/page.tsx

  auth/
    login/page.tsx → LoginClient.tsx
    registro/page.tsx
    callback/page.tsx               — Google OAuth callback

  mis-reservas/page.tsx
  favoritos/page.tsx
  perfil/page.tsx
  blog/[slug]/page.tsx
  acerca-de-nosotros/page.tsx
  pago/[reservaId]/page.tsx
  pago/resultado/page.tsx
```

## Auth
- `useAuthStore` (Zustand) — campos: `user`, `isAuthenticated`, `token`
- Token se persiste en localStorage
- `/lib/api.ts` inyecta `Authorization: Bearer {token}` automáticamente
- Roles: `admin`, `anfitrion`, `usuario`
- Admin layout y Anfitrion layout verifican rol y redirigen a `/` si no autorizado

## API
- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- Todos los calls via `api.get/post/put/delete` de `/lib/api.ts`

## Glamping Detail Page — Metadata OG
`app/glamping/[id]/page.tsx` — ISR + metadata:
```typescript
// Limpia descripción OG: quita frases de relleno y antepone precio
const rawDesc = (glamping.descripcionGlamping ?? '')
  .replace(/\*?este glamping te ofrece\*?[\s:,]*/gi, '')
  .replace(/\*?ven y disfruta\*?[\s,]*/gi, '')
  .trim()
const precioDesc = glamping.precioNoche
  ? `Desde $${Math.round(glamping.precioNoche).toLocaleString('es-CO')}/noche. `
  : ''
const ogDesc = (precioDesc + rawDesc).slice(0, 160)
```

## Panel Admin Bot (`app/admin/bot/page.tsx`)
- Layout dos paneles: lista de conversaciones (izquierda) + historial (derecha)
- Lista refresca cada 15s, historial refresca cada 5s (React Query `refetchInterval`)
- Burbujas estilo WhatsApp: verde para usuario, gris para bot
- Dot animado verde indicando "en vivo"
- Endpoints: `GET /bot/conversaciones?limit=100` y `GET /bot/conversaciones/{phone}?limit=200`

## Sistema de Calificaciones
- Admin/anfitrión genera link: `POST /calificaciones/link/{reserva_id}`
- Retorna URL: `/calificaciones/valorar/{token}`
- Página pública en `app/calificaciones/valorar/[token]/page.tsx`
  - Carga info del glamping via `GET /calificaciones/valorar/{token}`
  - Envía via `POST /calificaciones/valorar/{token}` con `{estrellas, comentario?}`
  - Muestra error para tokens inválidos/ya usados
- Botón "Link calificación" aparece en reservas con estado COMPLETADA
  - En `admin/reservas/page.tsx` y `anfitrion/reservas/page.tsx`
  - Modal muestra link + mensaje WhatsApp listo para copiar

## Comentarios públicos (`app/comentarios/page.tsx`)
- Formulario público (sin auth requerida)
- Campos: tipo (felicitación/sugerencia/queja/otro), nombre/email (opcionales), mensaje (requerido)
- `POST /comentarios/`
- Muestra pantalla de éxito tras envío

## Convenciones
- Componentes de página del servidor en `page.tsx` (sin 'use client')
- Lógica interactiva en `*Client.tsx` con `'use client'`
- Colores brand: `bg-brand` = verde Glamperos (definido en Tailwind config)
- Stone palette para fondos/textos neutros
- `rounded-2xl` para cards, `border border-stone-200` para bordes sutiles
- `cn()` de `/lib/utils` para clases condicionales

## Variables de entorno
```
NEXT_PUBLIC_API_URL        — URL del backend FastAPI
NEXT_PUBLIC_SITE_URL       — URL del sitio (para canonical, OG, JSON-LD)
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```
