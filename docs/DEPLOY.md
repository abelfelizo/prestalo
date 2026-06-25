# Despliegue de Kuotas (EAS Build)

La app corre hoy en **Expo Go** (desarrollo). Para distribuirla se usa **EAS Build**.
Estos pasos los ejecuta el dueño de la cuenta Expo.

## ⭐ Ruta recomendada: Android (NO necesita cuenta Apple Developer)

Sin pagar la suscripción de Apple ($99/año) puedes tener la app **instalable y con push real** en Android:

```bash
npm i -g eas-cli
eas login            # cuenta gratis de expo.dev
eas init             # crea el projectId (necesario para el push token)
eas build --profile android-apk --platform android   # genera un APK
```
- EAS te da un enlace para **descargar el APK** → instálalo directo en tu teléfono y el de los
  cobradores (no necesitas Google Play).
- En ese build, el **push remoto funciona** (Android usa FCM, no requiere Apple).
- Publicar en **Google Play** es opcional y cuesta **$25 una sola vez** (`eas build --profile production --platform android` → `eas submit --platform android`).

Mientras tanto puedes probar gratis en tu Android con **Expo Go** (escanea el QR de `npx expo start`):
funciona todo menos el push remoto (ese necesita el APK/dev build).

## iOS (requiere cuenta Apple Developer para distribuir)
- Simulador iOS: gratis (lo que usamos en desarrollo).
- Instalar en iPhone físico / TestFlight / App Store: **requiere** el Apple Developer Program ($99/año).

## Requisitos
- Cuenta en https://expo.dev
- `npm i -g eas-cli`
- `eas login`

## Inicializar
```bash
eas init            # crea el projectId y lo guarda en app.json (expo.extra.eas.projectId)
```

## Builds
```bash
# Cliente de desarrollo (para probar módulos nativos sin Expo Go)
eas build --profile development --platform ios

# Preview interno (simulador iOS)
eas build --profile preview --platform ios

# Producción
eas build --profile production --platform ios
eas build --profile production --platform android
```
Perfiles definidos en `eas.json`.

## Enviar a las tiendas
```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

## Pendientes antes de publicar
- [ ] **Rotar la anon key** de Supabase (estuvo en git) y cargarla como variable del build.
- [ ] **Íconos y splash propios** (hoy son placeholders en `assets/`).
- [ ] **Bucket de fotos privado** + URLs firmadas (hoy es público).
- [ ] Desactivar/pulir "Confirm email" en Supabase Auth según el flujo deseado.
- [ ] Completar el email de contacto en `docs/PRIVACIDAD.md` y publicar la política.
- [ ] (Opcional) Push remoto: requiere dev build + credenciales de notificaciones.

## Push remoto (notificación con la app cerrada)

Infraestructura ya lista:
- Columna `prestamistas.push_token` (se guarda al abrir la app — sólo con dev build).
- `src/lib/notificaciones.ts` → `registrarPush()` obtiene y guarda el token.
- Edge Function `enviar-push` (desplegada): recibe `{ to, title, body }` y la envía por la
  Expo Push API.

Ya desplegado, además de `enviar-push`:
- Edge Function **`push-diario`**: recorre los prestamistas con `push_token`, cuenta sus cobros
  de hoy y envía la notificación. Lista para un cron diario.

Falta para activarlo (necesita **dev build / APK**, no Expo Go):
1. `eas init` + `eas build` (el token requiere el `projectId` de EAS) e instalar el APK.
2. Activar el envío automático diario con pg_cron + pg_net (pega tu ANON KEY):
   ```sql
   create extension if not exists pg_net;
   select cron.schedule('kuotas-push-diario', '0 13 * * *', $$
     select net.http_post(
       url := 'https://pphnaasmirbnuilgzfeo.functions.supabase.co/push-diario',
       headers := jsonb_build_object(
         'Content-Type','application/json',
         'Authorization','Bearer <TU_ANON_KEY>'
       )
     );
   $$);
   ```
   (13:00 UTC ≈ 9:00 AM en RD.)
3. Probar manualmente:
   ```bash
   curl -X POST 'https://pphnaasmirbnuilgzfeo.functions.supabase.co/push-diario' \
     -H "Authorization: Bearer <ANON_KEY>"
   ```

## Monetización — Suscripción (RevenueCat + tiendas)

**Modelo:** prueba gratis de **30 días** (anclada a `prestamistas.created_at`), luego un único
plan **Kuotas Pro — US$9.99/mes**. Al caducar la prueba sin pagar → **modo solo lectura**
(puede ver sus datos, pero no crear clientes/préstamos ni registrar cobros hasta suscribirse).

El cobro se hace con **RevenueCat** sobre StoreKit (iOS) y Play Billing (Android). El mismo
código sirve para ambas tiendas. Apple retiene 30% (15% tras 1 año); Google retiene 15%.

### Código (ya implementado)
- `src/lib/iap.ts` — init, sincronización, compra y restauración (degrada sin crashear en Expo Go).
- `src/store/suscripcion.ts` — estado: `cargando | prueba | activa | expirada`.
- `src/lib/guard.ts` — `exigirSuscripcion(router)`: bloquea la escritura y lleva al paywall.
- `app/suscripcion.tsx` — pantalla de paywall.
- `src/components/AvisoSuscripcion.tsx` — banner de días de prueba / solo lectura.
- Entitlement esperado en RevenueCat: **`pro`**. Producto: **`kuotas_pro_mensual`**.

### Pasos para activarlo
1. Crea cuenta en https://www.revenuecat.com (gratis hasta US$2.5k/mes de ingresos).
2. **App Store Connect** (iOS):
   - Crea la app con bundle `com.kuotas.app`.
   - Crea una suscripción auto-renovable `kuotas_pro_mensual`, precio US$9.99/mes.
   - (Opcional) Oferta introductoria de prueba si quieres también trial nativo de tienda.
3. **Google Play Console** (Android):
   - Crea la app con package `com.kuotas.app`.
   - Crea el producto de suscripción `kuotas_pro_mensual`, US$9.99/mes.
4. En RevenueCat:
   - Conecta ambas apps, crea el entitlement **`pro`** y enlázale los productos.
   - Crea una "Offering" actual con el paquete mensual.
   - Copia las **API keys públicas** (una iOS, una Android).
5. Pon las keys en `.env`:
   ```
   EXPO_PUBLIC_RC_IOS_KEY=appl_xxx
   EXPO_PUBLIC_RC_ANDROID_KEY=goog_xxx
   ```
6. **Build nativo** (`eas build`) — las compras NO funcionan en Expo Go.

> Nota: la prueba de 30 días la gestiona la app por fecha de alta del prestamista, así que el
> usuario disfruta el periodo gratis **sin** introducir método de pago; al día 31 entra en
> solo lectura y el paywall le ofrece suscribirse.
