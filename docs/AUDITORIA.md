# Auditoría multidisciplinaria — Kuotas (Préstalo)

_Fecha: 2026-06-27 · Revisión basada en código y base de datos en vivo (no de memoria)._
_Alcance: ~7,600 líneas TS/TSX · Expo SDK 55 / RN 0.83 · Supabase (Postgres + RLS + Edge Functions) · RevenueCat._

> **Calificación global ponderada: 7.4 / 10** — Producto sólido, bien construido y casi listo
> para un piloto. Hay **un hallazgo crítico de seguridad** (backend compartido sin RLS en otras
> tablas) y **un riesgo de integridad de datos** (cálculo de saldos del lado del cliente en modo
> offline) que conviene cerrar antes de cobrar a clientes reales.

---

## 1. Arquitectura y código — **8 / 10**

**Bien:**
- Separación limpia por capas: `api/` (acceso a datos), `lib/` (lógica pura), `store/` (estado),
  `app/` (pantallas con expo-router). Fácil de mantener.
- Lógica de negocio (intereses, mora, calendario) **aislada y pura** en `src/lib/calculos.ts` y
  cubierta por tests. Esto es lo correcto: el dinero se calcula en un solo lugar testeable.
- TypeScript estricto, `tsc` en 0 errores, 17/17 tests verdes.
- Estado de servidor con TanStack Query + persistencia local (la app abre con datos aunque no haya red).

**A mejorar:**
- La lógica financiera vive en dos sitios paralelos: `calcularPrestamo` y `calendarioPrestamo`
  reimplementan la fórmula de interés. Si un día cambia una, la otra puede quedar desfasada.
- Cobertura de tests solo en cálculos; no hay tests de flujos de API ni de la cola offline.

## 2. Seguridad — **6 / 10**  ⚠️ (la nota la baja un hallazgo crítico, no la app en sí)

**Bien (de Kuotas):**
- RLS activado en todas las tablas de Kuotas; helpers `es_mi_cartera`, `soy_dueno_cartera`, etc.
- Borrado de cuenta real vía Edge Function (requisito de tiendas).
- Mensajes de error que no filtran detalles internos; bloqueo anti-fuerza-bruta del acceso de heredero.
- Funciones endurecidas con `search_path` fijo.

**🔴 CRÍTICO — Backend compartido con otras apps sin protección:**
El proyecto Supabase `pphnaasmirbnuilgzfeo` **aloja además otras dos apps** (`libro_*` y `turno_*`).
Las tablas `libro_clientes`, `libro_deudas`, `libro_abonos`, `libro_herederos`,
`libro_transferencias`, etc. tienen **RLS DESACTIVADO (nivel ERROR)** → cualquiera con la anon key
puede leer/escribir esos datos. No es data de Kuotas, **pero comparten la misma base, la misma
anon key y el mismo riesgo reputacional/legal.** Recomendación fuerte: **separar Kuotas a su propio
proyecto Supabase** antes de lanzar, o como mínimo activar RLS en todas las tablas `libro_*`.

**🟠 Importante:**
- **Anon key aún sin rotar** y está embebida en el workflow de GitHub (`ota-update.yml`) y en `eas.json`.
  Es pública por diseño, pero estuvo en git y debe rotarse + depender 100% de RLS.
- **Protección de contraseñas filtradas** (HaveIBeenPwned) sigue **desactivada** en Supabase Auth.
- **Caché local sin cifrar** (AsyncStorage): en un teléfono robado/rooteado se puede leer la cartera
  en texto plano. El PIN es solo una puerta visual.
- Muchas funciones `SECURITY DEFINER` ejecutables por `anon`/`authenticated`. La mayoría son helpers
  internos; conviene revocar `EXECUTE` a `anon` en las que no deban ser públicas.

## 3. Datos e integridad — **6.5 / 10**

**Bien:**
- Saldos, cuotas, score y caja se actualizan con **triggers en la BD** (fuente de verdad en el
  servidor, no en el teléfono). Soft-delete en caja/garantías: nada se borra de verdad.
- Cola offline (`outbox.ts`) con **dead-letter**: una operación que falla por datos no se pierde en
  silencio, pasa a una cola de fallidas reintentables.

**🟠 Riesgo de integridad (offline + concurrencia):**
- `registrarPago` y `crearPrestamo` envían `saldo_antes`/`saldo_despues`/`saldo_pendiente`
  **calculados en el cliente**. Si un pago se encola offline y se sincroniza horas después (o desde
  dos dispositivos), el saldo calculado puede estar **desactualizado** y sobrescribir el real.
  Recomendación: que el saldo lo calcule el **trigger** a partir del saldo actual de la BD, y que la
  app solo envíe el monto/tipo de pago. Hoy `actualizar_tras_pago` ya pisa el saldo con
  `NEW.saldo_despues` del cliente — ahí está el punto débil.
- **Sin backups gestionados (PITR)**: el plan Supabase actual probablemente es Free. Para producción
  con dinero real es obligatorio Pro + Point-in-Time-Recovery.
- Reportes agregados en el cliente; escalará mal con muchos datos (mover a SQL/vistas).

## 4. Diseño y UX — **8.5 / 10**

**Bien:**
- Sistema de design tokens (`theme.ts`), tipografías Sora + Plus Jakarta, paleta índigo/cian coherente.
- Iteración real con usuario: header del cliente, tabs de cartera, lista de cuotas, saludo
  personalizado, ajuste de montos largos a una línea. Se nota pulido.
- Flujos cortos y en español dominicano, con WhatsApp integrado para cobro.

**A mejorar:**
- Accesibilidad: faltan `accessibilityLabel` en botones de solo-icono y verificar contraste de texto
  blanco sobre degradado.
- No hay estados vacíos ilustrados ni "skeletons" de carga en todas las pantallas (hay spinners sueltos).
- Falta soporte de fuentes grandes del sistema / modo oscuro.

## 5. Comercial y monetización — **7.5 / 10**

**Bien:**
- Modelo claro y simple: prueba de 30 días anclada al **servidor** (`prestamistas.created_at`, no se
  resetea al reinstalar) → US$9.99/mes, un solo producto, entitlement "pro".
- Decisión correcta de **no bloquear** mientras RevenueCat no esté configurado (no deja fuera a nadie hoy).

**A mejorar / pendiente:**
- RevenueCat + producto `kuotas_pro_mensual` **aún sin configurar** → hoy no se puede cobrar.
- Sin cuentas de Apple Developer / Google Play todavía.
- Falta política de privacidad publicada con email de contacto, y registro fiscal (RNC/DGII) para
  facturar legal en RD.
- Riesgo de negocio: un solo precio en USD para un mercado que piensa en RD$; considerar precio local.

## 6. Cumplimiento legal y operativo — **6 / 10**

- Borrado de cuenta in-app ✔ (requisito de tiendas).
- **Pendiente:** política de privacidad pública + email, términos de uso, y aviso de que es una
  herramienta de gestión (no una entidad financiera). El préstamo informal está regulado; conviene
  un descargo de responsabilidad.
- Confirmación de correo: el enlace hoy da error (aunque confirma). Arreglar antes del lanzamiento.

## 7. Operaciones / DevOps — **8 / 10**

**Bien:**
- Pipeline sin PC: GitHub Actions construye APK (cambios nativos) y publica OTA (cambios de JS).
  Confirmado funcionando: los cambios llegan al teléfono sin reinstalar.
- Migraciones versionadas en `supabase/migrations/`.

**A mejorar:**
- Secretos (anon key) en texto plano dentro de los workflows; mover a GitHub Secrets.
- Sin monitoreo de errores en producción (Sentry/crash reporting) ni analítica de uso.
- Sin entorno de staging: hoy se trabaja directo sobre `main` y la BD de producción.

---

## Resumen de calificaciones

| # | Dimensión | Nota |
|---|---|---|
| 1 | Arquitectura y código | 8.0 |
| 2 | Seguridad | 6.0 |
| 3 | Datos e integridad | 6.5 |
| 4 | Diseño y UX | 8.5 |
| 5 | Comercial y monetización | 7.5 |
| 6 | Cumplimiento legal | 6.0 |
| 7 | Operaciones / DevOps | 8.0 |
| | **Global (ponderado)** | **7.4** |

---

## Lista de mejoras, correcciones y novedades

### 🔴 Antes de cobrar / lanzar (bloqueantes)
1. **Separar Kuotas a su propio proyecto Supabase** (o activar RLS en todas las tablas `libro_*`).
2. **Rotar la anon key** y moverla a GitHub Secrets (sacarla de los workflows y `eas.json`).
3. **Activar Supabase Pro + PITR/backups.**
4. **Recalcular saldos en el trigger**, no en el cliente (cierra el riesgo offline/concurrencia).
5. Activar protección de contraseñas filtradas en Auth.
6. Configurar RevenueCat + producto y cuentas Apple/Google.
7. Publicar política de privacidad + email + términos; arreglar enlace de confirmación de correo.

### 🟠 Calidad y robustez (corto plazo)
8. Unificar la fórmula de interés en una sola función reutilizada por preview y calendario.
9. Cifrar la caché local (expo-secure-store para datos sensibles).
10. Añadir Sentry (crash reporting) y analítica básica.
11. Tests de flujos de API y de la cola offline; idempotencia en reintentos (evitar pago doble).
12. Revocar `EXECUTE` a `anon` en funciones `SECURITY DEFINER` que no deban ser públicas.

### 🟢 Producto / novedades (mediano plazo)
13. Modo oscuro y soporte de fuentes grandes / accesibilidad (labels, contraste).
14. Precio en moneda local (RD$) y/o plan anual con descuento.
15. Recordatorios automáticos de cobro por WhatsApp (plantillas) y notificaciones push.
16. Reportes en SQL (vistas) con exportación a PDF/Excel.
17. Multiusuario/colaboradores por cartera con roles (ya hay base: `es_colaborador`, `invitar_colaborador`).
18. Estados vacíos ilustrados y skeletons de carga.
19. Panel web de solo lectura para el prestamista (consultar cartera desde la PC).
20. Score de cliente visible con historial y semáforo de riesgo.
