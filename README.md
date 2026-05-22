# MisFinanzas Pro: Documentación de Fase 1 (Cimientos SaaS)

Este proyecto ha sido inicializado bajo estándares de ingeniería de software para productos SaaS comerciales. A continuación, se detalla la arquitectura y las decisiones técnicas tomadas.

## 📁 Estructura de Carpetas (Arquitectura Profesional)

- **`src/app/`**: Corazón de la aplicación (Next.js App Router). Contiene las rutas, layouts compartidos y el árbol de navegación. Se prioriza Server Components para velocidad de carga.
- **`src/components/shared/`**: Biblioteca de UI propia. Aquí residen los componentes con estilo **Glassmorphism** (Cards, GlassButtons, Modals). Son componentes "atómicos" sin lógica de negocio.
- **`src/components/features/`**: Módulos funcionales del SaaS (e.g., `WizardIngreso`, `DashboardKpis`). Esta separación facilita que el equipo crezca sin causar conflictos.
- **`src/lib/`**: Configuraciones de bajo nivel y "vendors" (Supabase, Stripe). Contiene funciones utilitarias de alto rendimiento (`utils.ts`).
- **`src/services/`**: Capa de abstracción de datos. En lugar de llamar a `supabase.from(...)` desde los componentes, lo centralizamos aquí. **Crítico para seguridad y multi-tenencia**.
- **`src/hooks/`**: Lógica de estado reactiva personalizada para el negocio (e.g., `useFinancialData`, `useSubscriptionStatus`).
- **`src/types/`**: "Single Source of Truth" para TypeScript. Define los modelos de dominio (Usuarios, Transacciones, Licencias).

## 🚀 Preparación para Entorno Productivo

1. **Variables de Entorno**: Configurado via `.env.local` (ejemplo en `.env.example`).
2. **Seguridad Nativa**: Preparado para Row Level Security (RLS). Cada consulta se filtra automáticamente por `user_id` en el backend.
3. **Optimización de Activos**: Next.js se encarga de servir imágenes y fuentes de forma optimizada automáticamente.

## 💎 Diferencial UI/UX: Glassmorphism Pro

Se han inyectado tokens de diseño en `globals.css` que utilizan:
- **Lógica de Opacidad Adaptativa**: Fondo translúcido con desenfoque de fondo (`backdrop-blur`).
- **Bordes con Gradientes Sutiles**: Para dar profundidad y sensación de "cristal".
- **Animaciones Aceleradas por GPU**: Pre-configuradas para transiciones fluidas entre pantallas.

## 💰 Enfoque en Monetización

La arquitectura está lista para:
- Detectar el `subscription_status` en el layout principal para bloquear/habilitar modales.
- Integrar un SDK de pagos en la carpeta `services/payments`.
- Manejar límites de datos por nivel de suscripción mediante lógica centralizada en los hooks.
