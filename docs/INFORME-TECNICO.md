# Informe técnico — Kuotas

_Evaluación de estado real, viabilidad y preparación para mercado._
_Fecha: 2026-06-26 · Evaluador: rol de desarrollador senior de apps/software._

## 0. Método

Evaluación basada en evidencia, no en suposiciones:
- `tsc --noEmit` → **0 errores**.
- `jest` → **17/17 tests** (lógica de negocio: intereses, mora, calendario).
- `expo export --platform ios` → **bundle generado OK** (4.2 MB Hermes, exit 0): la app
  compila y enlaza por completo, incluida la capa de suscripción.
- Auditoría del backend con el linter de seguridad de Supabase (`get_advisors`) y revisión de RLS.
- Lectura de la capa de datos (offline, outbox, persister, borrados).

## 1. Veredicto ejecutivo

**Estado: Release Candidate — funcional y sólida, NO 100% lista para venta pública hoy.**

- ✅ Lista para **beta cerrada** (instalar a prestamistas conocidos) **ya**.
- ⛔ Para **lanzamiento público (GA)** faltan: endurecimiento de seguridad/datos, requisitos
  de tienda (borrado de cuenta, plan de backups) y correcciones puntuales. Estimado: **1–2 semanas**.

Viabilidad **técnica: ALTA**. Viabilidad **económica: ALTA** (costos bajos, modelo claro).

## 2. Arquitectura (correcta)

- **Fuente de verdad = Supabase Postgres (servidor).** El teléfono solo guarda **caché de
  lectura** (TanStack Query persistida) y un **outbox** de escrituras pendientes. Esto es lo
  correcto: la data del negocio NO vive solo en el dispositivo.
- Lógica financiera centralizada y testeada (`src/lib/calculos.ts`).
- Seguridad por fila (RLS) en todas las tablas de Kuotas, con helpers `SECURITY DEFINER`.
- Triggers de negocio en la BD (caja, saldos, mora) → la app no duplica lógica crítica.

## 3. Hallazgos (con severidad)

### 🔴 Críticos / Altos (resolver antes de GA)
1. **Plan de Supabase Free** → en producción se **pausa por inactividad** y **no tiene backups
   robustos**. Para datos de dinero es inaceptable. **Acción: Supabase Pro (US$25/mes) con
   backups diarios + PITR (point-in-time recovery).** Esta es la pieza #1 para "no perder data".
2. **RLS deshabilitado en 8 tablas `libro_*`** (de OTRA app en el mismo proyecto Supabase) →
   el linter lo marca como ERROR: con el anon key cualquiera puede leerlas/escribirlas. No es
   data de Kuotas, pero comparten proyecto y anon key. **Acción: habilitar RLS en esas tablas
   o separar Kuotas a su propio proyecto Supabase** (recomendado a futuro).
3. **Anon key estuvo en el historial de git** → **rotarla** y recargarla como variable del build.
4. **`outbox.flush()` descarta silenciosamente** las operaciones que fallan por algo que no sea
   red (p.ej. validación) → en el peor caso se **pierde un cobro encolado sin avisar**.
   **Acción: marcar como "fallida" y notificar, no descartar.** (Corrección de código.)
5. **Borrado físico (`DELETE`)** en clientes, caja y garantías → si alguien borra, solo se
   recupera desde backup. **Acción: soft-delete (`deleted_at`)** para que nada se pierda de verdad.

### 🟡 Medios
6. **Sin Error Boundary global**: un error de render deja pantalla en blanco (los datos están a
   salvo en el servidor, pero es mala UX). **Acción: añadir ErrorBoundary** + pantalla de recuperación.
7. **Sin monitoreo de errores** (Sentry/Crashlytics) → no te enteras de crashes en producción.
8. **Funciones `SECURITY DEFINER` ejecutables por `anon`** (`anular_pago`, `es_mi_cartera`, …).
   `acceso_heredero` es intencional; el resto conviene **revocar EXECUTE a anon** y fijar
   `search_path`.
9. **`function_search_path_mutable`** en varias funciones → fijar `search_path` (endurecimiento).
10. **Protección de contraseñas filtradas (HaveIBeenPwned) desactivada** en Auth → **activarla**.
11. **Outbox vive solo en el dispositivo**: desinstalar la app con escrituras pendientes sin
    sincronizar las pierde. Mitiga con sincronización agresiva al abrir y aviso visible (ya hay banner).

### 🟢 Menores / deuda
12. Cobertura de tests solo en cálculos; faltan tests de API/flujos/RLS.
13. Íconos/splash son placeholders.
14. Reportes se agregan en cliente (ok ahora; mover a SQL cuando escale).

## 4. Estándares de tienda (market-readiness)

- **Borrado de cuenta in-app**: Apple y Google **lo exigen** para apps con cuenta. **Verificar/implementar.**
- **Política de privacidad** publicada (hay borrador en `docs/PRIVACIDAD.md`) + formularios de
  "Data Safety" (Play) y "App Privacy" (Apple).
- **⚠️ Política de préstamos de Google Play**: Play restringe apps de "préstamos personales".
  Kuotas es una **herramienta de gestión para el prestamista (B2B), no otorga préstamos al
  usuario final** → normalmente permitido, pero la ficha debe dejarlo MUY claro para evitar rechazo.
- **IAP**: la suscripción debe pasar por StoreKit/Play Billing (ya implementado vía RevenueCat).
- Apple Developer (US$99/año) obligatorio para iOS.

## 5. Garantía de no pérdida de datos (respuesta directa)

**Hoy:** si la app falla, se cierra, se borra o cambian de teléfono, **los datos NO se pierden**
porque viven en Supabase (servidor), no en el teléfono. Al reinstalar e iniciar sesión, todo vuelve.
El almacenamiento local es solo caché + cola de pendientes.

**Para garantizarlo de forma profesional, faltan 4 cosas:**
1. **Supabase Pro + backups diarios + PITR** (recuperar a cualquier minuto de los últimos días). #1.
2. **Soft-delete** (`deleted_at`) en vez de borrado físico → nada se elimina de verdad; recuperable.
3. **Arreglar el outbox** (no descartar pendientes; reintentos con aviso) → ninguna escritura se pierde.
4. **Export/respaldo para el usuario** (CSV de su cartera) — opcional pero da confianza.

Con (1)+(2)+(3), la pérdida de datos por un fallo de la app es prácticamente imposible.

## 6. Viabilidad económica (resumen)

- **Costos fijos bajos**: Supabase Pro ~US$25/mes, RevenueCat gratis (<US$2.5k/mes), Apple
  US$99/año, Play US$25 único.
- **Ingreso**: SaaS US$9.99/mes con 30 días de prueba. Break-even operativo con ~4–6 suscriptores.
- **Mercado**: prestamistas informales en RD (boca a boca fuerte). Modelo recurrente y escalable.

## 7. Checklist para pasar de RC a GA

- [ ] Supabase **Pro** + backups/PITR
- [ ] **Rotar** anon key
- [ ] Habilitar **RLS** en tablas `libro_*` (o separar proyecto)
- [ ] **Soft-delete** en borrados
- [ ] Corregir **outbox** (no descartar pendientes)
- [ ] **ErrorBoundary** + **Sentry**
- [ ] **Borrado de cuenta** in-app
- [ ] Endurecer funciones (`search_path`, revoke `anon`) + activar protección de contraseñas
- [ ] Íconos/splash + fichas de tienda (con disclaimer de préstamos)
- [ ] Política de privacidad publicada
