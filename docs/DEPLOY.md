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
