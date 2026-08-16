# Saldo Transporte

App web para **estimar** el saldo de tu tarjeta de transporte público (no lo lee físicamente de la tarjeta). Calcula el saldo a partir de:

- Recargas manuales que registras.
- Descuentos automáticos programados por horario (a la hora que sueles usar el transporte).
- Ajustes manuales cuando usas el transporte más o menos veces de lo normal.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com/) (Postgres + Auth + Row Level Security)

Este proyecto comparte el mismo proyecto de Supabase que **Migrante$** (no hay slots libres para crear uno nuevo). Todas las tablas usan el prefijo `transporte_` para no chocar con las tablas `migrante_` del otro proyecto, y referencian `auth.users(id)` directamente — quedan desacopladas de las tablas de Migrante$.

## Configuración

1. Copia `.env.example` a `.env.local` y completa las credenciales del proyecto de Supabase compartido (Dashboard → Settings → API):

   ```bash
   cp .env.example .env.local
   ```

2. Instala dependencias y levanta el entorno de desarrollo:

   ```bash
   npm install
   npm run dev
   ```

## Base de datos

El schema vive versionado en `supabase/`:

- `supabase/schema.sql` — tablas base (`transporte_config`, `transporte_horarios`, `transporte_movimientos`) con RLS. **Ya fue ejecutado** en el proyecto de Supabase; se conserva aquí como referencia.
- `supabase/migrations/002_auto_deduct.sql` — agrega:
  - Un trigger que mantiene `transporte_config.saldo_actual` sincronizado automáticamente con los movimientos (recargas, descuentos, ajustes), sin que la app tenga que actualizar dos tablas a la vez.
  - La función `transporte_procesar_descuentos()`, que revisa los horarios activos de todos los usuarios y aplica el descuento automático de los que ya se cumplieron hoy y aún no se han registrado (evita duplicados).
  - Instrucciones opcionales para programar esa función con `pg_cron` cada 15 minutos, para que el descuento ocurra puntual aunque nadie tenga la app abierta.

**Pendiente de ejecutar:** corre `supabase/migrations/002_auto_deduct.sql` en el SQL Editor de Supabase. Sin esto, las recargas/ajustes seguirán insertándose en `transporte_movimientos` pero `saldo_actual` no se recalculará solo, y no habrá descuento automático por horario.

Si no habilitas `pg_cron`, el descuento automático igual se aplica: cada vez que un usuario abre el dashboard, la app llama a `transporte_procesar_descuentos()` como respaldo (ver `app/(dashboard)/layout.tsx`).

## Funcionalidades

- **Costo de viaje configurable** — `/configuracion`.
- **Horarios de uso programado** (hora + días de la semana) — `/horarios`. El descuento se aplica automáticamente a esa hora.
- **Recargas manuales** — desde `/dashboard`.
- **Ajustes por uso inusual** (viaje extra o viaje que no se hizo) — desde `/dashboard`.
- **Historial completo de movimientos** — `/historial`.

## Autenticación

Usa Supabase Auth (email + contraseña) contra el mismo `auth.users` compartido con Migrante$. Una cuenta creada en cualquiera de las dos apps puede iniciar sesión en la otra.
