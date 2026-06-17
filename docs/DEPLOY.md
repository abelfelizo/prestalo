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
