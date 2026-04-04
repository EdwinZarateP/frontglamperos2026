# Frontend GLAMPEROS 2026 - Documentación

Esta carpeta contiene la documentación específica del frontend de GLAMPEROS.

## 📁 Archivos de Documentación

- **FRONTEND.md**: Documentación completa del frontend Next.js
- **README.md**: Este archivo

## 🔗 Documentación General

La documentación general del proyecto se encuentra en la carpeta raíz `docs/`:

- [`../docs/CONTEXT.md`](../../docs/CONTEXT.md) - Contexto y descripción del proyecto
- [`../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) - Arquitectura técnica detallada
- [`../docs/START.md`](../../docs/START.md) - Guía de inicio rápido
- [`../docs/TASKS.md`](../../docs/TASKS.md) - Tareas y roadmap
- [`../docs/DECISIONS.md`](../../docs/DECISIONS.md) - Decisiones de arquitectura
- [`../docs/SESSION.md`](../../docs/SESSION.md) - Historial de sesiones de desarrollo

## 🔗 Documentación del API

La documentación del backend (API) se encuentra en [`../apiglamperos2026/docs/`](../../apiglamperos2026/docs/):

- [`../apiglamperos2026/docs/API.md`](../../apiglamperos2026/docs/API.md) - Documentación de endpoints de la API

## 🚀 Enlaces Rápidos

- **URL Frontend**: `http://localhost:3000` (desarrollo)
- **Framework**: Next.js 16.1.6
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand

## 📖 Cómo Usar esta Documentación

1. **Para entender el proyecto**: Comienza con [`../docs/CONTEXT.md`](../../docs/CONTEXT.md)
2. **Para entender la arquitectura**: Revisa [`../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
3. **Para trabajar en el frontend**: Consulta [`FRONTEND.md`](./FRONTEND.md)
4. **Para integrar con el API**: Revisa [`../apiglamperos2026/docs/API.md`](../../apiglamperos2026/docs/API.md)
5. **Para comenzar a desarrollar**: Sigue [`../docs/START.md`](../../docs/START.md)

## 🔧 Conexión con el API

El frontend se conecta al backend mediante HTTP/REST:

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

Asegúrate de configurar la variable de entorno `NEXT_PUBLIC_API_URL` en tu archivo `.env.local`.

## 📞 Soporte

Para preguntas o problemas, revisa el archivo [`../docs/TASKS.md`](../../docs/TASKS.md) para ver el estado actual de las tareas.