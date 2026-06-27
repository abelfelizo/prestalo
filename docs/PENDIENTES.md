# Kuotas — Tareas pendientes antes de lanzar

_Estado al cierre de esta sesión. La app está completa, rediseñada y endurecida;
empaqueta sin errores (tsc 0 · 17/17 tests · bundle OK)._

---

## ✅ Hecho (no requiere nada más)

- App funcional completa (clientes, préstamos, pagos, caja, garantías, herederos, reportes, multiusuario).
- **Rediseño visual completo** (Sora + Plus Jakarta, paleta índigo/cian) en todas las pantallas.
- Monetización: prueba 30 días → US$9.99/mes (RevenueCat), modo solo lectura al caducar.
- **Seguridad:**
  - RLS activado en todas las tablas de Kuotas.
  - Borrado de cuenta in-app (Apple/Google).
  - Soft-delete (caja, garantías) — nada se borra de verdad.
  - Outbox sin pérdida silenciosa + ErrorBoundary.
  - Mensajes de error que no filtran detalles internos.
  - **Fotos de garantías eliminadas** — solo se registra el tipo; no se almacenan datos sensibles.
  - Bloqueo anti-fuerza-bruta en el acceso de heredero.
  - Funciones de BD endurecidas (search_path, permisos anon).

---

## 🟢 Para PROBAR en Android (lo único que falta para el APK)

Lo corres tú (con tu cuenta gratis de expo.dev). No requiere terminal si usas la web de Expo.

1. Crear cuenta en https://expo.dev
2. `eas login` → `eas init` (vincula el proyecto, crea el projectId)
3. `eas build --profile android-apk --platform android`
4. Expo te da un **link/QR** → descargas el APK y lo instalas.

> Nota: las **compras** (suscripción) solo funcionan tras conectar RevenueCat (ver abajo).
> Para probar la app en sí, el APK basta.

---

## 🔴 Antes de cobrar / publicar al público (acciones TUYAS)

| Tarea | Dónde | Por qué |
|---|---|---|
| **Rotar la anon key** de Supabase | Supabase → Settings → API | Estuvo en git; higiene básica |
| **Plan Supabase Pro + backups/PITR** (~US$25/mes) | Supabase → Billing | Para no perder datos en producción |
| **Activar protección de contraseñas filtradas** | Supabase → Auth → Policies | Punto 10 del checklist |
| **Confirmación de correo: arreglar el enlace** | Supabase → Auth (Site URL/Redirect) + página de éxito | Hoy el enlace de confirmación da error (aunque confirma). En el lanzamiento oficial: configurar un destino para que el enlace abra una pantalla limpia (opción 2). |
| **RevenueCat + producto** `kuotas_pro_mensual` | revenuecat.com + tiendas | Para cobrar (ver `docs/DEPLOY.md`) |
| **Cuenta Apple Developer** (US$99/año) y/o **Google Play** (US$25) | developer.apple.com / play | Para publicar en tiendas |
| **Publicar política de privacidad** + email de contacto | `docs/PRIVACIDAD.md` (falta el email) | Requisito legal y de tienda |
| **RNC / DGII** (comprobante fiscal NCF) | DGII | Para facturar legal en RD |

---

## 🟡 Mejoras de código recomendadas (puedo hacerlas yo)

| Tarea | Prioridad | Nota |
|---|---|---|
| **Cifrar la caché local** (AsyncStorage) | Media | En un teléfono robado/rooteado se puede leer la cartera en texto plano. El PIN es solo una puerta visual. |
| **Verificar flujo "olvidé mi contraseña"** | Media | Recuperación de cuenta. |
| **Mover reportes a SQL** (hoy se agregan en cliente) | Baja | Solo importa cuando escale a muchos datos. |
| **Tests de API/flujos** (hoy solo cálculos) | Baja | Más cobertura. |

---

## ℹ️ Notas

- **`npm audit`** reporta vulnerabilidades, pero están en **herramientas de build de Expo**
  (xmldom, node-forge, shell-quote, ws), **no en la app que corre en el teléfono**. No ejecutar
  `npm audit fix --force` (rompe el toolchain de Expo); se resuelven al subir de Expo SDK.
- El bucket de storage `garantias` quedó **vacío y sin uso** (ya no se suben fotos). Se puede
  eliminar desde Supabase → Storage si se desea; no es necesario.
- Recuerda: `npm install` siempre con `--legacy-peer-deps`.
