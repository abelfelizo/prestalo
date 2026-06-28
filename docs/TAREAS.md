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

- [x] **Reporte suma caja borrada** — `getReporte` ahora filtra `deleted_at` y propaga el error. **[Claude] ✓**
- [x] **No ignorar el error** de la consulta de caja en `getReporte`. **[Claude] ✓**
- [x] **Unificar la fórmula de interés** — nueva `interesDeCuota` usada por cálculo total, calendario
      y próxima cuota (`src/lib/calculos.ts`). **[Claude] ✓**
- [x] **`capital_inicial` de la cartera** se registra como entrada de caja al crearla. **[Claude] ✓**
- [x] **Formato de montos en WhatsApp** — `whatsapp.ts` usa `fmt`. **[Claude] ✓**
- [x] **Subir el mínimo de la clave de heredero** (ahora 6 caracteres). **[Claude] ✓**
- [ ] **Cifrar la caché local** — requiere dependencia con cifrado simétrico (ej. react-native-mmkv
      con encryptionKey) + clave en SecureStore; NO es de una línea. Pendiente como tarea propia. **[Claude]**
- [ ] **Integrar Sentry / crash reporting** — requiere DSN **[Tú]** + rebuild nativo. **[Claude]**
- [ ] **Mover agregaciones a SQL** (dashboard/reportes/balance) — cambio mayor, mejor con tests. **[Claude]**
- [ ] **Activar protección de contraseñas filtradas** (Supabase Auth). **[Tú]**
- [ ] **Tests de la nueva lógica** (idempotencia, `interesDeCuota`, cola offline). **[Claude]**

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

---

## Actualización (cierre de tareas de código de Claude)

**Completado y desplegado:**
- ✅ Caché local **cifrada** (AES-256, clave en SecureStore; JS puro, vía OTA) — `src/lib/secureCache.ts`.
- ✅ **Agregaciones en SQL**: `metricas_cartera` y `reporte_cartera` (migración 0017); dashboard y reportes ya no agregan en el cliente.
- ✅ **Semáforo de riesgo** del cliente en el detalle.
- ✅ **Accesibilidad**: `accessibilityLabel`/`role` en botones de solo icono (agregar, alertas, volver).
- ✅ Partes 1–5 del brief (PR #2, ya en main).

**Pendiente — requieren algo externo (no son código puro de Claude):**
- 🔴 **Sentry / crash reporting**: necesita tu DSN + recompilar el APK (módulo nativo).
- 🔴 **Exportar PDF / archivo**: necesita módulo nativo (`expo-print`/`expo-sharing`) → recompilar APK. Hoy el reporte se comparte como texto/CSV.
- 🔴 **Recordatorios automáticos por WhatsApp**: WhatsApp no permite envío automático sin la **WhatsApp Business API** (cuenta/costo tuyo). La app ya manda recordatorio local diario y abre WhatsApp con el mensaje listo.
- 🔴 **Precio en RD$ / plan anual**: decisión tuya + configuración en RevenueCat.
- 🟡 **Roles de colaborador (solo lectura)**: la base existe; **aplicarlo** exige rediseñar RLS por tabla (cambio sensible) — requiere tu visto bueno de alcance.
- 🟡 **Modo oscuro**: es una funcionalidad nueva grande (re-tematizar 26 pantallas), no una corrección; se agenda aparte.
- 🟡 **Transferencia de cartera al heredero (fase 2)**: documentada en `docs/PROPUESTA_TRANSFERENCIA_HERENCIA.md`; requiere tu aprobación de diseño.
