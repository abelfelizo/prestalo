# Política de Privacidad — Préstalo

_Última actualización: 2026-06-16_

Préstalo ("la app") es una herramienta para que prestamistas gestionen sus carteras de préstamos.

## Qué datos recopilamos
- **Cuenta**: correo electrónico (para autenticación).
- **Datos que tú ingresas**: nombre y teléfono del prestamista; nombre, teléfono, cédula,
  dirección y referencias de tus clientes; montos, tasas y estado de los préstamos y pagos;
  movimientos de caja; fotos de garantías; datos de herederos.
- **Datos técnicos mínimos** necesarios para que la app funcione.

## Para qué los usamos
Únicamente para prestarte el servicio: mostrar tu cartera, calcular cuotas y mora, registrar
pagos y caja, enviar recordatorios y, si lo activas, permitir el acceso de tu heredero.

## Dónde se guardan
En **Supabase** (base de datos y almacenamiento). El acceso está restringido por seguridad a
nivel de fila (RLS): cada usuario solo puede ver su propia información y la de las carteras que
le hayan compartido.

## Con quién se comparten
No vendemos ni compartimos tus datos con terceros. Los mensajes a clientes se envían por
**WhatsApp** desde tu propio dispositivo y cuenta.

## Tus derechos
Puedes editar o eliminar tus clientes, préstamos y datos desde la app, y cerrar tu cuenta.
Para eliminar por completo tu cuenta y datos, escríbenos.

## Datos sensibles
Las fotos de garantías (cédulas, tarjetas) son datos sensibles. Recomendamos subir solo lo
necesario. *(Pendiente de hardening: el almacenamiento de fotos debe migrarse a un bucket
privado con URLs firmadas.)*

## Contacto
[Define aquí tu email de contacto]
