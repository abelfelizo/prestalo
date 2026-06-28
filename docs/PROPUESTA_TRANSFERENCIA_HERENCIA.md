# Propuesta (Fase 2, NO implementada) — Transferencia real de la cartera al heredero

_Brief Parte 4.5. Documento de diseño para aprobación del dueño. No se implementa en este lote._

## Situación actual
Hoy el heredero solo **consulta** (lectura) la cartera vía `acceso_heredero`, tras el período de
inactividad. No puede continuar cobrando ni administrar.

## Objetivo
Permitir que, bajo condiciones estrictas, la propiedad de la(s) cartera(s) pase a la cuenta del
heredero para que pueda seguir operando (`carteras.prestamista_id` → id del heredero).

## Por qué es sensible
Cambiar `prestamista_id` mueve **propiedad de datos de dinero** entre cuentas. Un error o abuso
transfiere clientes, préstamos, pagos y caja a otra persona. Requiere diseño y aprobación explícita.

## Diseño propuesto (a validar)
1. **El heredero debe ser usuario de Kuotas** (registrar su propia cuenta). Hoy no lo es.
2. **Doble condición** para habilitar la transferencia:
   - inactividad del dueño ≥ umbral (`acceso_disponible_desde` ya se registra, migración 0015), y
   - confirmación explícita del heredero dentro de la app (acepta responsabilidad).
3. **Ventana de gracia / revocación:** al iniciarse la transferencia, notificar al dueño (push +
   alerta) con N días para cancelarla si sigue vivo (evita que un viaje largo entregue la cartera).
4. **RPC `transferir_cartera(p_cartera, p_heredero)`** con `security definer`, que valide ambas
   condiciones, registre el cambio en una tabla de auditoría (`transferencias_cartera`) y actualice
   `prestamista_id`. Nunca borrar datos.
5. **Auditoría inmutable:** quién, cuándo, desde/hacia qué cuenta.

## Pendiente de decisión del dueño
- ¿Transferencia total o solo lectura ampliada (registrar pagos sin cambiar propiedad)?
- Umbral de la ventana de revocación.
- Requisitos legales (RD) para ceder cartera de crédito a un tercero.
