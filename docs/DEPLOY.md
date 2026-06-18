# Despliegue de Préstalo (EAS Build)

La app corre hoy en **Expo Go** (desarrollo). Para distribuirla (TestFlight / Google Play)
se usa **EAS Build**. Estos pasos los ejecuta el dueño de la cuenta Expo.

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

Falta para activarlo (necesita **dev build**, no Expo Go):
1. `eas init` + `eas build` (el token requiere el `projectId` de EAS).
2. Para envío automático "app cerrada", programar una llamada diaria a una función que recorra
   los prestamistas con cobros de hoy y llame a `enviar-push` con su token. Opciones:
   - pg_cron + pg_net (http_post a la función), o
   - una segunda Edge Function `push-diario` invocada por un cron de Supabase.
3. Probar enviando manualmente:
   ```bash
   curl -X POST 'https://pphnaasmirbnuilgzfeo.functions.supabase.co/enviar-push' \
     -H "Authorization: Bearer <anon_o_user_jwt>" -H 'Content-Type: application/json' \
     -d '{"to":"ExponentPushToken[...]","title":"Préstalo","body":"Tienes cobros hoy"}'
   ```
