# Préstalo v2 — Blueprint (reconstruir la app sobre el backend existente)

> **Dirección:** el backend de Supabase **ya existe y es la fuente de verdad**. NO se reconstruye la base.
> Se reconstruye la **app** para que use bien el esquema real, se completan módulos y se añade seguridad (RLS).
> Tablas `libro_*` y `turno_*` son de otras apps en la misma base → **no tocar**.

## 0. Contexto verificado (2026-06-16)

- Proyecto Supabase: `pphnaasmirbnuilgzfeo` ("Prestalo"), org LaGuagua, `ACTIVE_HEALTHY`.
- La base tiene un **esquema profesional y completo** de Préstalo, **más avanzado que el código v1** (que se restauró de git y es **incompatible** con este esquema).
- **0 filas / 0 usuarios** en todas las tablas (sin datos que migrar).
- **RLS desactivado en todas las tablas, 0 políticas** → hueco de seguridad a cerrar.
- `prestamistas.id` **NO** referencia `auth.users` → hoy el modelo es **PIN local hasheado** (`pin_hash`), sin Supabase Auth; todo entra por la anon key.
- Tipos generados en [`types/database.ts`](../types/database.ts) (regenerar con el MCP de Supabase).

## 1. Esquema real (tablas de Préstalo)

```
prestamistas (id, nombre, telefono, pin_hash, metodo_seguridad, moneda_principal, cartera_activa_id, ts)
  └─ carteras (prestamista_id, nombre, moneda, capital_inicial, color, activa, ts)
       ├─ configuracion_cartera (cartera_id, aplica_mora, tipo_mora, valor_mora, dias_gracia,
       │                         mora_maxima, aplica_mora_sobre, mensaje_mora_whatsapp, ts)
       ├─ caja (cartera_id, tipo, categoria, monto, descripcion, referencia_id, fecha, ts)
       ├─ clientes (cartera_id, nombre, telefono, cedula, direccion, referencia_nombre/telefono,
       │            score, total_prestado, total_pagado, veces_atrasado, activo, deleted_at, ts)
       └─ prestamos (cartera_id, cliente_id, monto_capital, saldo_pendiente, tasa_interes,
            │         modelo_interes, frecuencia_cobro, num_cuotas, cuotas_pagadas, fecha_inicio,
            │         fecha_proximo_pago, fecha_ultimo_pago, dias_en_mora, estado, prestamo_padre_id,
            │         total_intereses_generados, total_mora_generada, deleted_at, ts)
            ├─ pagos (prestamo_id, cliente_id, monto_total, monto_interes, monto_capital, monto_mora,
            │         tipo_pago, dias_atraso_al_pagar, saldo_antes, saldo_despues, fecha_pago, ts)
            └─ garantias (prestamo_id, tipo, descripcion, foto_urls[], estado, fecha_recibida, fecha_devuelta, ts)
prestamistas
  ├─ herederos (prestamista_id, nombre, telefono, relacion, clave_hash, dias_inactividad, ultima_actividad, activo, ts)
  └─ alertas (prestamista_id, tipo, titulo, mensaje, referencia_id, leida, fecha_alerta, ts)
```

> No existe tabla de **cuotas individuales**: el calendario se modela con `num_cuotas` /
> `cuotas_pagadas` / `fecha_proximo_pago` en `prestamos`.

### Vocabulario (CHECK constraints) — la app DEBE respetarlo
| Campo | Valores válidos |
|---|---|
| `carteras.color` | `green` `amber` `blue` `purple` `red` (¡nombres, no hex!) |
| `prestamistas.metodo_seguridad` | `face_id` `pin_4` `pin_6` |
| `prestamos.estado` | `activo` `cerrado` `refinanciado` `en_mora` |
| `prestamos.modelo_interes` | `flat` `sobre_saldo` |
| `prestamos.frecuencia_cobro` | `diario` `semanal` `quincenal` `mensual` |
| `pagos.tipo_pago` | `cuota_completa` `solo_interes` `abono_capital` `parcial` `mora` |
| `caja.tipo` / `caja.categoria` | `entrada` `salida` / `capital_nuevo` `cobro` `cobro_mora` `desembolso` `retiro_personal` `otro` |
| `garantias.tipo` / `estado` | `tarjeta_bancaria` `cedula` `titulo_vehiculo` `propiedad` `joyas` `otro` / `en_poder` `devuelta` |
| `herederos.relacion` | `familiar` `socio` `amigo` `abogado` |
| `configuracion_cartera.tipo_mora` | `porcentaje_diario` `porcentaje_semanal` `monto_fijo` |
| `configuracion_cartera.aplica_mora_sobre` | `saldo_pendiente` `monto_original` `cuota` |
| `alertas.tipo` | `cobro_hoy` `mora` `heredero` `cartera` |

## 2. Incompatibilidades del código v1 a corregir (la app NO funciona contra este esquema)

| Área | v1 (git) | Esquema real |
|---|---|---|
| Préstamo monto | `monto_principal`, `monto_total`, `total_pagado` | `monto_capital`, `saldo_pendiente` (sin monto_total/total_pagado) |
| Préstamo estado | `activo/completado/vencido/cancelado` | `activo/cerrado/refinanciado/en_mora` |
| Préstamo tipo/plazo | `tipo_interes`, `plazo_semanas` | `modelo_interes`, `frecuencia_cobro` + `num_cuotas` |
| Cartera color | hex (`#1a1a2e`) | enum (`green/amber/blue/purple/red`) |
| Cartera moneda | `moneda` | `moneda` (ok) |
| Pago | `{monto, fecha_pago, estado}` | desglose capital/interes/mora + saldo_antes/despues + tipo_pago |
| Auth | PIN texto plano en AsyncStorage | `pin_hash` en `prestamistas` (hashear) |
| `db.ts` queries | tablas/campos inexistentes | reescribir contra columnas reales |

## 3. Decisión pendiente — modelo de seguridad / RLS

Hoy no hay Supabase Auth y RLS está apagado. Dos caminos para cerrar el hueco:
- **A. Adoptar Supabase Auth** (recomendado): ligar `prestamistas.id` a `auth.users`, activar RLS por
  `auth.uid()`. Más seguro y estándar. Implica login real (teléfono/OTP o email) + PIN/biometría como bloqueo local.
- **B. Mantener PIN local + anon key**: requiere RLS basada en algún claim/secreto; más frágil. No recomendado
  para una app de dinero multiusuario.

*(Definir antes de F1.)*

## 4. Stack de la app v2

Igual que el plan previo: Expo 55 / expo-router / TS strict, **TanStack Query** (server state + caché),
**Zustand** (sesión/cartera activa), **SecureStore + expo-local-authentication** (PIN/biometría),
**offline** con expo-sqlite + outbox (fase posterior), tipos desde `types/database.ts`.

Estructura: `app/` solo rutas; `src/{api,hooks,components,lib,store,db,types}`.

## 5. Roadmap

- **F0 – Alineación + cimientos:** reescribir `lib/db.ts` y tipos contra el esquema real; instalar
  TanStack Query + Zustand; decidir e implementar modelo de Auth + **activar RLS** en tablas de Préstalo;
  PIN con `pin_hash` + SecureStore/biometría.
- **F1 – Core transaccional:** crear cliente → crear préstamo (con `num_cuotas`/`frecuencia_cobro` y preview)
  → registrar pago (con desglose capital/interés/mora y actualización de saldo/caja).
- **F2 – Cobranza:** "cobros de hoy" (vía `fecha_proximo_pago`), mora automática (`configuracion_cartera`),
  alertas, WhatsApp en UI.
- **F3 – Módulos avanzados:** caja completa, garantías (fotos), herederos, refinanciación (`prestamo_padre_id`).
- **F4 – Offline + extras:** sqlite/outbox, multi-cartera, reportes.

## 6. Lógica de negocio v1 reutilizable

- `lib/calculos.ts` (cálculo flat/sobre_saldo, días de mora, fmt) — reusar, **adaptar** nombres y `fmt` por moneda.
- `lib/whatsapp.ts` — reusar y conectar a UI; aprovechar `configuracion_cartera.mensaje_mora_whatsapp`.
