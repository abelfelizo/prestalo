# Kuotas

App móvil (Expo / React Native + expo-router, TypeScript) para que prestamistas de
microcrédito gestionen sus carteras de préstamos. Backend en **Supabase**.

## Setup

```bash
npm install --legacy-peer-deps   # OJO: --legacy-peer-deps
npm test                         # tests de lógica de negocio
npx tsc --noEmit                 # typecheck
npx expo start                   # dev server (Expo Go o simulador)
```

Crea un `.env` en la raíz (no está en git) con:

```
EXPO_PUBLIC_SUPABASE_URL=https://pphnaasmirbnuilgzfeo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key del proyecto Supabase>
```

## Estructura

- `app/` — rutas (expo-router): grupos `(auth)` y `(app)`.
- `src/api/` — capa de datos tipada contra Supabase.
- `src/lib/` — cálculos, supabase, query/offline, pin, whatsapp, notificaciones, constants.
- `src/store/` — estado Zustand (session, pinPrompt).
- `src/components/`, `src/types/database.ts` (autogenerado).

## Despliegue

Ver `docs/DEPLOY.md` (build con EAS — Android sin cuenta Apple).
