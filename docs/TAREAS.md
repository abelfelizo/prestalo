# Kuotas — Lista de tareas (derivada de la auditoría)

_Generada el 2026-06-27 a partir de `docs/AUDITORIA.md`._
Leyenda: **[Claude]** = lo puedo hacer yo en el código/BD · **[Tú]** = requiere tu cuenta o decisión externa.
Prioridad: 🔴 bloqueante antes de cobrar · 🟠 importante · 🟢 mejora/novedad.

---

## 🔴 Bloqueantes (antes de cobrar a un cliente real)

- [x] **Idempotencia de escrituras** — `client_op_id` único en pagos/préstamos/caja + upsert con
      `ignoreDuplicates`. Reintentos ya no duplican. _(migración 0008, api + screens)_ **[Claude] ✓**
- [x] **Saldos calculados en el servidor** — `actualizar_tras_pago` recalcula el saldo desde la BD,
      ya no confía en `saldo_despues` del cliente. _(migración 0009)_ **[Claude] ✓**
- [x] **Refinanciamiento atómico** — RPC `refinanciar_prestamo` (una transacción, idempotente,
      SECURITY INVOKER). _(migración 0010)_ **[Claude] ✓**
- [x] **Endurecer el PIN** — contraseña de la cuenta para "Olvidé mi PIN", bloqueo tras 5 intentos
      (5 min) en lock y en acciones sensibles, y sal por dispositivo en el hash. **[Claude] ✓**
- [ ] **Separar Kuotas a su propio proyecto Supabase** (o activar RLS en todas las tablas `libro_*`
      del proyecto compartido). **[Tú]** (puedo guiarte / preparar migraciones)
- [ ] **Rotar la anon key** y moverla a GitHub Secrets (sacarla de `eas.json` y los workflows). **[Tú]**
- [ ] **Supabase Pro + PITR/backups** (~US$25/mes). **[Tú]**
- [ ] **Configurar RevenueCat** + producto `kuotas_pro_mensual` + cuentas Apple/Google. **[Tú]**
- [ ] **Política de privacidad (con email) + términos de uso** publicados. **[Tú]** (puedo redactarlos)
- [ ] **Arreglar el enlace de confirmación de correo** (Site URL/Redirect en Supabase Auth). **[Tú]**

## 🟠 Correcciones de calidad (rápidas, bajo riesgo)

- [ ] **Reporte suma caja borrada** — filtrar `deleted_at` en la consulta de caja
      (`src/api/reportes.ts:21-24`). 1 línea. **[Claude]**
- [ ] **No ignorar el error** de la consulta de caja en `getReporte`. **[Claude]**
- [ ] **Unificar la fórmula de interés** en una sola función reutilizada por preview y calendario
      (`src/lib/calculos.ts`). **[Claude]**
- [ ] **`capital_inicial` de la cartera** debe registrarse como entrada de caja al crearla. **[Claude]**
- [ ] **Cifrar la caché local** (datos sensibles a expo-secure-store en vez de AsyncStorage). **[Claude]**
- [ ] **Formato de montos en WhatsApp** — usar `fmt` (con decimales/moneda) en `whatsapp.ts` y quitar
      el `RD$` fijo en `heredero-acceso.tsx:34`. **[Claude]**
- [ ] **Activar protección de contraseñas filtradas** (Supabase Auth). **[Tú]**
- [ ] **Subir el mínimo de la clave de heredero** (hoy 4 caracteres). **[Claude]**
- [ ] **Integrar Sentry / crash reporting** (ya hay enganche en `ErrorBoundary.tsx:20`). **[Claude]** + key **[Tú]**
- [ ] **Mover agregaciones a SQL** (dashboard/reportes/balance hoy se suman en el cliente). **[Claude]**

## 🟢 Novedades / producto (mediano plazo)

- [ ] Modo oscuro + accesibilidad (labels en botones de icono, contraste, fuentes grandes). **[Claude]**
- [ ] Precio en RD$ y/o plan anual con descuento. **[Tú]** decide, **[Claude]** implementa
- [ ] Recordatorios automáticos por WhatsApp (plantillas) y push remoto (`registrarPush` ya existe). **[Claude]**
- [ ] Reportes en PDF/Excel (hoy solo CSV por Share). **[Claude]**
- [ ] Panel web de solo lectura para consultar la cartera desde la PC. **[Claude]**
- [ ] Roles de colaborador (base ya existe: `es_colaborador`, `invitar_colaborador`). **[Claude]**
- [ ] Tests de flujos de API y de la cola offline (hoy solo cálculos). **[Claude]**
- [ ] Score de cliente con historial y semáforo de riesgo. **[Claude]**

---

### Orden sugerido para arrancar (lo que puedo hacer yo, sin esperar tus cuentas)
1. Correcciones rápidas 🟠 (reporte/caja, fórmula única, capital inicial, formato WhatsApp).
2. Idempotencia de escrituras 🔴 (el de mayor impacto en dinero).
3. Saldos en el servidor 🔴 + refinanciamiento atómico 🔴.
4. Endurecer el PIN 🔴.

Las tareas **[Tú]** (Supabase Pro, rotar llave, RevenueCat, cuentas de tienda, legales) van en
paralelo y no me bloquean para avanzar en el código.
