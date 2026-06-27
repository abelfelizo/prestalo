# Auditoría profunda — Kuotas (Préstalo)

_Fecha: 2026-06-27 · Revisión archivo por archivo de todo el repositorio + verificación contra la base de datos en vivo._
_Alcance auditado: 26 pantallas (`app/`), 12 módulos de API, 12 librerías (`src/lib`), 3 stores, 4 componentes, 7 migraciones SQL, 1 edge function, configs de build/OTA. ~7,600 líneas._

> **Calificación global ponderada: 7.1 / 10.**
> Base de código limpia, consistente y madura para una primera versión. La revisión a fondo
> confirmó los dos hallazgos grandes de la primera pasada y destapó **tres nuevos problemas de
> integridad de dinero** (doble cobro por reintentos, refinanciamiento no atómico, reporte que
> suma movimientos borrados) y **una debilidad real del PIN**. Ninguno es catastrófico, todos
> tienen arreglo claro. La nota baja sobre todo por seguridad/integridad financiera, no por calidad.

---

## Metodología
- Lectura íntegra de cada archivo (no muestreo).
- Verificación en BD: triggers reales, advisors de seguridad, constraints de `pagos`, columnas, cron.
- No se ejecutaron los flujos en un dispositivo (los hallazgos de integridad son por análisis de
  código + esquema, no fallas reproducidas en runtime).

---

## 1. Arquitectura y código — **8.5 / 10**
**Bien:** capas limpias (`api`/`lib`/`store`/`app`), lógica financiera pura y testeada en
`src/lib/calculos.ts`, TypeScript estricto (tsc 0), patrón uniforme en las 26 pantallas
(useQuery/useMutation + invalidaciones), `errMsg` saneando errores en todas, `Boton` y tokens de
`theme.ts` reutilizados. Es notablemente consistente.
**A mejorar:**
- Fórmula de interés **duplicada** en `calcularPrestamo`, `calendarioPrestamo` e
  `interesDeProximaCuota` (`calculos.ts`). Un cambio en una puede desincronizar las otras.
- Agregaciones en cliente (`dashboard.ts`, `reportes.ts`, `caja.ts:getBalanceCaja`) — escalan mal.

## 2. Seguridad — **5.5 / 10** ⚠️
**Bien:** RLS correcto en todas las tablas de Kuotas (`0001_auth_rls.sql`), helpers
`SECURITY DEFINER` con `search_path` fijo y `EXECUTE` revocado a `anon`, edge function de borrado
bien diseñada (cliente-usuario para los datos + service role solo para Auth), rate-limit de heredero
(`0006`).

**🔴 CRÍTICO — backend compartido sin RLS.** El proyecto Supabase aloja además `libro_*` y
`turno_*`; los advisors marcan **8 tablas `libro_*` con RLS DESACTIVADO (ERROR)** accesibles con la
misma anon key. → Separar Kuotas a su propio proyecto, o activar RLS en esas tablas, antes de lanzar.

**🟠 PIN sin protección real** (`app/(auth)/lock.tsx`):
- `olvidePin()` (línea 83) **reinicia el PIN sin pedir ninguna credencial**. Como la sesión de
  Supabase queda persistida en AsyncStorage, quien tenga el teléfono desbloqueado entra con
  "Olvidé mi PIN" → crea uno nuevo → acceso total. El PIN hoy no protege un teléfono robado.
- Sin límite de intentos en `lock.tsx` ni en `PinPromptModal.tsx` (PIN de 4 dígitos = 10,000 combos).
- `hashPin` es SHA-256 **sin sal** de 4 dígitos (`pin.ts:7`) — tabla arcoíris trivial si se filtra.
- El "lock" no es un guard: las rutas `(app)` no verifican `desbloqueado`; un deep link podría
  saltarlo (impacto bajo en la práctica).

**🟠 Caché local sin cifrar.** `persister.ts` guarda toda la cartera en AsyncStorage en texto plano.

**🟠 Anon key sin rotar y en git.** Embebida en `eas.json` y en los dos workflows
(`build-apk.yml`, `ota-update.yml`). Es pública por diseño pero estuvo versionada → rotar + mover a
GitHub Secrets + depender 100% de RLS.

**🟡 Menores:** protección de contraseñas filtradas desactivada (advisor); clave de heredero mínimo
4 caracteres (`heredero/nuevo.tsx:45`); `invitarColaborador` revela si un email tiene cuenta
(enumeración leve).

## 3. Integridad de datos y dinero — **6 / 10**
**Bien:** triggers en BD como fuente de verdad (saldo, cuotas, score, caja), soft-delete con
`deleted_at`, outbox con **dead-letter** (nada se pierde en silencio), cron de `marcar_vencidos`
activo (2 jobs verificados), backfill de `total_prestado` ya aplicado.

**🟠 Doble cobro / doble préstamo por reintentos (sin idempotencia).** `outbox.ejecutar()`
(`outbox.ts:95-104`) reintenta encolando cuando detecta "error de red" — pero si el servidor
**sí escribió** y solo se cayó la respuesta, al hacer flush se inserta **otra vez**. La tabla
`pagos` solo tiene `pagos_pkey` (verificado: sin constraint de unicidad/idempotencia). Afecta
`registrarPago`, `crearPrestamo`, `crearMovimiento`. → Añadir un `client_op_id` único por operación
e `insert ... on conflict do nothing`.

**🟠 Saldos calculados en el cliente.** `pago/[id].tsx:111-112` envía `saldo_antes/saldo_despues`
desde la copia cacheada, y `actualizar_tras_pago` los escribe tal cual (`UPDATE ... saldo_pendiente
= NEW.saldo_despues`). Si el pago se encola offline y se sincroniza más tarde, o desde dos
dispositivos, pisa el saldo real. → Que el trigger calcule el saldo desde el valor actual en BD.

**🟠 Refinanciamiento no atómico.** `refinanciar.tsx:46-63` hace `crearPrestamo()` y luego
`marcarRefinanciado()` como dos llamadas sueltas (sin transacción y sin outbox). Si la segunda
falla, queda el préstamo nuevo **y** el viejo activo → doble conteo de cartera. → Unificar en una
RPC transaccional.

**🟠 Reporte suma caja borrada.** `reportes.ts:21-24` consulta `caja` **sin** filtrar
`deleted_at` (la columna existe, verificado), mientras `caja.ts:getMovimientos/getBalanceCaja` sí
filtran. → "Total cobrado" del reporte queda inflado al eliminar un cobro. Arreglo de una línea.

**🟡 Menores:** `getReporte` ignora el error de la consulta de caja (silencioso); `capital_inicial`
de una cartera nueva no entra como movimiento de caja → el balance no lo refleja.

## 4. Diseño y UX — **8.5 / 10**
**Bien:** sistema visual coherente (Sora + Plus Jakarta, índigo/cian), pulido iterado con el usuario
(header, tabs de cartera, saludo, ajuste de montos), estados vacíos en las listas, pull-to-refresh,
banners de pendientes/fallidas, flujos cortos en español dominicano, WhatsApp integrado.
**A mejorar:** accesibilidad (botones solo-icono sin `accessibilityLabel`, contraste de blanco sobre
degradado); sin modo oscuro ni tipografías grandes del sistema; `whatsapp.ts` formatea montos con
`toLocaleString()` sin decimales (inconsistente con `fmt`); `heredero-acceso.tsx:34` fija "RD$".

## 5. Comercial y monetización — **7.5 / 10**
Modelo simple y bien implementado: prueba de 30 días anclada al servidor (no se resetea al
reinstalar, `iap.ts`), un producto US$9.99/mes, modo solo-lectura al caducar, y la decisión correcta
de **no bloquear** mientras no haya RevenueCat (`iap.ts:77`). **Pendiente:** configurar RevenueCat
(hoy no se puede cobrar), cuentas Apple/Google, y evaluar precio en RD$ / plan anual.

## 6. Cumplimiento legal — **6 / 10**
Borrado de cuenta in-app ✔. **Pendiente:** política de privacidad con email de contacto, términos de
uso, descargo (no es entidad financiera), y arreglar el enlace de confirmación de correo
(`login.tsx:35-43` ya maneja el caso sin sesión, pero el enlace en sí falla).

## 7. Operaciones / DevOps — **7.5 / 10**
Pipeline sin PC sólido: `build-apk.yml` (solo en cambios nativos) + `ota-update.yml` (JS) con
filtros de rutas bien pensados; migraciones versionadas. **A mejorar:** secretos en texto plano en
los workflows; sin Sentry/crash reporting; sin entorno de staging (se trabaja sobre la BD de prod).

---

## Resumen de calificaciones
| # | Dimensión | Nota |
|---|---|---|
| 1 | Arquitectura y código | 8.5 |
| 2 | Seguridad | 5.5 |
| 3 | Integridad de datos y dinero | 6.0 |
| 4 | Diseño y UX | 8.5 |
| 5 | Comercial | 7.5 |
| 6 | Cumplimiento legal | 6.0 |
| 7 | Operaciones / DevOps | 7.5 |
| | **Global (ponderado)** | **7.1** |

---

## Lista priorizada de mejoras, correcciones y novedades

### 🔴 Bloqueantes antes de cobrar / publicar
1. Separar Kuotas a su propio proyecto Supabase (o activar RLS en `libro_*`).
2. **Idempotencia de escrituras** (`client_op_id` + `on conflict do nothing`) — evita doble cobro.
3. Mover el cálculo de saldo al trigger (no confiar en `saldo_despues` del cliente).
4. Refinanciamiento atómico (una sola RPC transaccional).
5. Endurecer el PIN: pedir contraseña de la cuenta para "Olvidé mi PIN", límite de intentos con
   bloqueo temporal, y sal en el hash.
6. Rotar la anon key y moverla a GitHub Secrets; Supabase Pro + PITR/backups.
7. Configurar RevenueCat + cuentas de tienda; política de privacidad + términos.

### 🟠 Correcciones de calidad (rápidas)
8. `reportes.ts`: filtrar `deleted_at` en la consulta de caja (1 línea). _Puedo hacerlo ya._
9. Cifrar la caché local (datos sensibles a expo-secure-store).
10. Unificar la fórmula de interés en una sola función.
11. No ignorar el error de la consulta de caja en `getReporte`.
12. Reflejar `capital_inicial` de la cartera como entrada de caja.
13. Activar protección de contraseñas filtradas; subir mínimo de clave de heredero.
14. Integrar Sentry (ya hay enganche en `ErrorBoundary.tsx:20`).

### 🟢 Novedades / producto (mediano plazo)
15. Modo oscuro + accesibilidad (labels, contraste, fuentes grandes).
16. Precio en RD$ y/o plan anual.
17. Recordatorios automáticos por WhatsApp (plantillas) y push remoto (`registrarPush` ya existe).
18. Reportes en SQL (vistas) con exportación a PDF/Excel (hoy solo CSV por Share).
19. Panel web de solo lectura para consultar la cartera desde la PC.
20. Roles de colaborador (ya hay base: `es_colaborador`, `invitar_colaborador`).
21. Tests de flujos de API y de la cola offline (hoy solo cálculos).
