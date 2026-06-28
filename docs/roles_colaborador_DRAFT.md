# Borrador — Roles de colaborador (cobrador con permisos acotados)

⚠️ **Requiere tu visto bueno de alcance antes de aplicar.** Cambia el control de acceso de una
función que ya está en uso (carteras compartidas), por eso no se aplica todavía.

## Situación actual
- `cartera_colaboradores(cartera_id, user_id, rol)` ya existe.
- Las políticas RLS de `clientes`, `prestamos`, `caja`, etc. usan `es_mi_cartera(cartera_id)`, que
  (vía `es_colaborador`) da al colaborador **acceso completo** (igual que el dueño): puede crear,
  editar y borrar todo. No hay distinción por `rol`.

## Decisión de producto pendiente (qué debe poder hacer un "cobrador")
Lo típico para un cobrador es: **ver** la cartera y **registrar pagos** — pero **no** borrar
clientes/préstamos, no editar la configuración ni la caja, no invitar/quitar colaboradores, no
gestionar herederos. Hay que confirmar este alcance contigo. Posibles roles:

| Rol | Ver | Registrar pago | Crear/editar cliente y préstamo | Borrar / config / caja / herederos |
|-----|-----|----------------|----------------------------------|------------------------------------|
| `dueño` | ✅ | ✅ | ✅ | ✅ |
| `editor` | ✅ | ✅ | ✅ | ❌ |
| `cobrador` | ✅ | ✅ | ❌ | ❌ |

## Esquema de implementación (cuando apruebes el alcance)
1. Helper `rol_en_cartera(cid) returns text` (SECURITY DEFINER) que devuelva `'dueño'` si
   `soy_dueno_cartera(cid)`, o el `rol` de `cartera_colaboradores`, o `null`.
2. Reemplazar cada política `for all` por políticas **separadas por acción**:
   - `SELECT`: dueño + cualquier colaborador.
   - `INSERT/UPDATE` en `pagos`: dueño + colaborador (`editor`/`cobrador`).
   - `INSERT/UPDATE` en `clientes`/`prestamos`: dueño + `editor`.
   - `DELETE` y `caja`/`configuracion_cartera`/`herederos`: solo dueño.
3. UI: al invitar, elegir rol; en la lista de colaboradores, mostrar y poder cambiar el rol.
   (`invitar_colaborador` debe aceptar el `rol`.)

## Riesgo
Políticas mal divididas pueden **bloquear a un colaborador en uso** o, peor, **permitir** lo que no
debe. Por eso se entrega como diseño + tabla de permisos para tu aprobación, y se aplicará en una
rama de Supabase con pruebas antes de producción.
