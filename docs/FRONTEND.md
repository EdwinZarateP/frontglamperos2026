# GLAMPEROS - Frontend Documentation

Documentación del frontend Next.js de GLAMPEROS.

**Framework**: Next.js 16.1.6 con App Router
**Language**: TypeScript
**Estilos**: Tailwind CSS 4
**Estado**: Zustand

---

## 📋 Tabla de Contenidos

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Setup](#instalación-y-setup)
- [Componentes Principales](#componentes-principales)
- [Rutas y Páginas](#rutas-y-páginas)
- [Estado Global](#estado-global)
- [API Client](#api-client)
- [Autenticación](#autenticación)
- [Estilos y Tailwind](#estilos-y-tailwind)
- [Build y Deploy](#build-y-deploy)

---

## 🏗️ Estructura del Proyecto

```
frontglamperos2026/
├── app/                        # App Router (rutas)
│   ├── layout.tsx             # Layout global
│   ├── page.tsx               # Home page
│   ├── providers.tsx           # Providers (Toast, etc.)
│   ├── globals.css             # Estilos globales
│   │
│   ├── [slug]/                 # Rutas dinámicas (glampings)
│   │   └── page.tsx           # Detalle de glamping
│   │
│   ├── auth/                   # Autenticación
│   │   ├── login/
│   │   ├── registro/
│   │   ├── recuperar/
│   │   └── google/callback
│   │
│   ├── admin/                  # Dashboard de administrador
│   ├── anfitrion/              # Dashboard de anfitrión
│   ├── mis-reservas/           # Reservas del usuario
│   ├── perfil/                 # Perfil de usuario
│   ├── glamping/               # Páginas de glamping
│   ├── favoritos/              # Favoritos del usuario
│   ├── calificaciones/         # Sistema de calificaciones
│   ├── calendario/             # Calendar view
│   ├── pago/                   # Página de pago Wompi
│   ├── blog/                   # Blog
│   └── acerca-de-nosotros/     # About page
│
├── components/                 # Componentes React
│   ├── admin/                 # Componentes admin
│   ├── anfitrion/             # Componentes anfitrión
│   ├── calificaciones/        # Sistema de calificaciones
│   ├── glamping/              # Componentes de glamping
│   ├── home/                  # Home components
│   ├── layout/                # Layout components (Header, Footer)
│   ├── reserva/               # Componentes de reserva
│   ├── seasonal/              # Seasonal components
│   └── ui/                    # UI components reutilizables
│
├── hooks/                      # Custom React Hooks
│   ├── useAuth.ts             # Hook de autenticación
│   └── useGlampings.ts        # Hook de glampings
│
├── lib/                        # Utilidades
│   ├── api.ts                 # Axios instance con interceptors
│   ├── catalogoExtras.ts      # Catálogo de servicios extra
│   ├── colombia.ts            # Datos de Colombia
│   ├── filtros.ts             # Lógica de filtros
│   ├── municipios.json        # Lista de municipios
│   ├── season.ts              # Lógica de temporadas
│   └── utils.ts               # Utilidades generales
│
├── store/                      # Zustand stores
│   ├── authStore.ts           # Estado de autenticación
│   └── searchStore.ts         # Estado de búsqueda
│
├── types/                      # TypeScript types
│   └── index.ts               # Tipos globales
│
└── public/                     # Assets estáticos
    ├── logos/
    ├── blog.png
    └── ejemplo.png
```

---

## 🚀 Instalación y Setup

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
npm install
```

### Variables de Entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_key
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 🧩 Componentes Principales

### Layout Components

- `Header`: Navegación principal con logo, menú, y autenticación
- `Footer`: Información de pie de página
- `Navbar`: Barra de navegación móvil

### UI Components

Componentes reutilizables en `components/ui/`:
- `Button`: Botón con variantes
- `Input`: Campo de input con validación
- `Modal`: Modal/dialog
- `Spinner`: Loading indicator
- `Card`: Card genérico
- `Toast`: Notificaciones

### Glamping Components

- `GlampingCard`: Card de glamping en listados
- `GlampingGrid`: Grid de glampings con paginación
- `ImageCarousel`: Carrusel de imágenes con drag & drop
- `AmenitiesList`: Lista de amenidades con iconos
- `CalendarGrid`: Calendar interactivo para disponibilidad

### Form Components

- `ReservaForm`: Formulario de reserva
- `GlampingForm`: Formulario de creación/edición de glamping
- `AuthForm`: Formularios de login/registro

---

## 📄 Rutas y Páginas

### Públicas

- `/`: Home page con listado de glampings
- `/glamping/[glampingId]`: Detalle de glamping
- `/favoritos`: Favoritos del usuario (requiere auth)
- `/calificaciones`: Sistema de calificaciones
- `/acerca-de-nosotros`: About page
- `/blog/[slug]`: Blog posts

### Autenticación

- `/auth/login`: Login
- `/auth/registro`: Registro
- `/auth/recuperar`: Recuperar contraseña
- `/auth/google/callback`: OAuth callback

### Dashboard Anfitrión

- `/anfitrion`: Dashboard principal
- `/anfitrion/mis-reservas`: Historial de reservas
- `/anfitrion/crear-glamping`: Crear nuevo glamping
- `/anfitrion/editar-glamping/[glampingId]`: Editar glamping
- `/anfitrion/[glampingId]`: Gestión de glamping

### Dashboard Admin

- `/admin`: Dashboard principal
- `/admin/usuarios`: Gestión de usuarios
- `/admin/glampings`: Gestión de glampings
- `/admin/reservas`: Gestión de reservas

### Usuario

- `/mis-reservas`: Reservas del usuario
- `/perfil`: Perfil de usuario
- `/pago`: Página de pago Wompi

---

## 🔄 Estado Global

### authStore

Estado de autenticación usando Zustand:

```typescript
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
}
```

**Uso**:

```typescript
import { useAuthStore } from '@/store/authStore'

const { user, isAuthenticated, login, logout } = useAuthStore()
```

### searchStore

Estado de búsqueda y filtros:

```typescript
interface SearchState {
  filters: SearchFilters
  results: Glamping[]
  total: number
  page: number
  setFilters: (filters: SearchFilters) => void
  setPage: (page: number) => void
  search: () => Promise<void>
}
```

---

## 🔌 API Client

Configuración de Axios en `lib/api.ts`:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
})

// Request interceptor: Adjunta JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: Maneja 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)
```

**Uso**:

```typescript
import { api } from '@/lib/api'

// GET request
const { data } = await api.get('/glampings/home', {
  params: { page: 1, limit: 20 }
})

// POST request
const { data } = await api.post('/reservas/', reservaData)
```

---

## 🔐 Autenticación

### useAuth Hook

Hook personalizado para manejar autenticación:

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth()

  if (isLoading) return <Spinner />

  if (!isAuthenticated) {
    return <button onClick={() => router.push('/auth/login')}>
      Iniciar Sesión
    </button>
  }

  return (
    <div>
      <p>Hola, {user.nombre}</p>
      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  )
}
```

### Login con Google

```typescript
const handleGoogleLogin = async () => {
  const redirectUrl = encodeURIComponent(window.location.origin + '/auth/google/callback')
  window.location.href = `${API_URL}/auth/google?redirect=${redirectUrl}`
}
```

---

## 🎨 Estilos y Tailwind

### Configuración

Tailwind CSS 4 configurado en `tailwind.config.mjs`:

```javascript
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
}
```

### Uso

```tsx
import cn from 'classnames'

function Button({ variant = 'primary', ...props }) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  }

  return (
    <button className={cn(baseStyles, variants[variant])} {...props}>
      {props.children}
    </button>
  )
}
```

---

## 🏗️ Build y Deploy

### Build para Producción

```bash
npm run build
```

### Ejecutar Producción

```bash
npm start
```

### Deploy en Vercel

```bash
npm install -g vercel
vercel
```

Variables de entorno en Vercel:
- `NEXT_PUBLIC_API_URL`: URL del backend en producción
- `NEXT_PUBLIC_MAPBOX_TOKEN`: Token de Mapbox
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`: API Key de Google Maps

---

## 📦 Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Build para producción
npm start            # Inicia servidor de producción
npm run lint         # Ejecuta ESLint
npm run type-check   # Verifica tipos TypeScript
```

---

## 🐛 Debugging

### Ver Logs

```bash
npm run dev
```

Los logs se muestran en la terminal.

### React DevTools

Instala la extensión de React DevTools en tu navegador.

### Network Requests

Usa la pestaña Network de DevTools para ver las peticiones HTTP.

---

## 📚 Recursos Adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Hook Form](https://react-hook-form.com)
- [Axios Documentation](https://axios-http.com/docs/intro)