// AUTO-GENERADO desde Supabase (proyecto pphnaasmirbnuilgzfeo).
// Regenerar con: mcp generate_typescript_types. NO editar a mano.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          created_at: string | null
          fecha_alerta: string
          id: string
          leida: boolean
          mensaje: string
          prestamista_id: string
          referencia_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          fecha_alerta: string
          id?: string
          leida?: boolean
          mensaje: string
          prestamista_id: string
          referencia_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          fecha_alerta?: string
          id?: string
          leida?: boolean
          mensaje?: string
          prestamista_id?: string
          referencia_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_prestamista_id_fkey"
            columns: ["prestamista_id"]
            isOneToOne: false
            referencedRelation: "prestamistas"
            referencedColumns: ["id"]
          },
        ]
      }
      caja: {
        Row: {
          cartera_id: string
          categoria: string
          created_at: string | null
          deleted_at: string | null
          descripcion: string | null
          fecha: string
          id: string
          monto: number
          referencia_id: string | null
          tipo: string
          client_op_id: string | null
        }
        Insert: {
          cartera_id: string
          client_op_id?: string | null
          categoria?: string
          created_at?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          fecha: string
          id?: string
          monto: number
          referencia_id?: string | null
          tipo: string
        }
        Update: {
          cartera_id?: string
          categoria?: string
          created_at?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          fecha?: string
          id?: string
          monto?: number
          referencia_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "caja_cartera_id_fkey"
            columns: ["cartera_id"]
            isOneToOne: false
            referencedRelation: "carteras"
            referencedColumns: ["id"]
          },
        ]
      }
      cartera_colaboradores: {
        Row: {
          cartera_id: string
          created_at: string
          id: string
          rol: string
          user_id: string
        }
        Insert: {
          cartera_id: string
          created_at?: string
          id?: string
          rol?: string
          user_id: string
        }
        Update: {
          cartera_id?: string
          created_at?: string
          id?: string
          rol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartera_colaboradores_cartera_id_fkey"
            columns: ["cartera_id"]
            isOneToOne: false
            referencedRelation: "carteras"
            referencedColumns: ["id"]
          },
        ]
      }
      carteras: {
        Row: {
          activa: boolean
          capital_inicial: number
          color: string
          created_at: string | null
          id: string
          moneda: string
          nombre: string
          prestamista_id: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean
          capital_inicial?: number
          color?: string
          created_at?: string | null
          id?: string
          moneda?: string
          nombre: string
          prestamista_id: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean
          capital_inicial?: number
          color?: string
          created_at?: string | null
          id?: string
          moneda?: string
          nombre?: string
          prestamista_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carteras_prestamista_id_fkey"
            columns: ["prestamista_id"]
            isOneToOne: false
            referencedRelation: "prestamistas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          activo: boolean
          cartera_id: string
          cedula: string | null
          client_op_id: string | null
          created_at: string | null
          deleted_at: string | null
          direccion: string | null
          id: string
          nombre: string
          referencia_nombre: string | null
          referencia_telefono: string | null
          score: number
          telefono: string
          total_pagado: number
          total_prestado: number
          updated_at: string | null
          veces_atrasado: number
        }
        Insert: {
          activo?: boolean
          cartera_id: string
          client_op_id?: string | null
          cedula?: string | null
          created_at?: string | null
          deleted_at?: string | null
          direccion?: string | null
          id?: string
          nombre: string
          referencia_nombre?: string | null
          referencia_telefono?: string | null
          score?: number
          telefono: string
          total_pagado?: number
          total_prestado?: number
          updated_at?: string | null
          veces_atrasado?: number
        }
        Update: {
          activo?: boolean
          cartera_id?: string
          cedula?: string | null
          created_at?: string | null
          deleted_at?: string | null
          direccion?: string | null
          id?: string
          nombre?: string
          referencia_nombre?: string | null
          referencia_telefono?: string | null
          score?: number
          telefono?: string
          total_pagado?: number
          total_prestado?: number
          updated_at?: string | null
          veces_atrasado?: number
        }
        Relationships: [
          {
            foreignKeyName: "clientes_cartera_id_fkey"
            columns: ["cartera_id"]
            isOneToOne: false
            referencedRelation: "carteras"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_cartera: {
        Row: {
          aplica_mora: boolean
          aplica_mora_sobre: string
          cartera_id: string
          created_at: string | null
          dias_gracia: number
          id: string
          mensaje_mora_whatsapp: string | null
          mora_maxima: number | null
          tipo_mora: string | null
          updated_at: string | null
          valor_mora: number | null
        }
        Insert: {
          aplica_mora?: boolean
          aplica_mora_sobre?: string
          cartera_id: string
          created_at?: string | null
          dias_gracia?: number
          id?: string
          mensaje_mora_whatsapp?: string | null
          mora_maxima?: number | null
          tipo_mora?: string | null
          updated_at?: string | null
          valor_mora?: number | null
        }
        Update: {
          aplica_mora?: boolean
          aplica_mora_sobre?: string
          cartera_id?: string
          created_at?: string | null
          dias_gracia?: number
          id?: string
          mensaje_mora_whatsapp?: string | null
          mora_maxima?: number | null
          tipo_mora?: string | null
          updated_at?: string | null
          valor_mora?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_cartera_cartera_id_fkey"
            columns: ["cartera_id"]
            isOneToOne: false
            referencedRelation: "carteras"
            referencedColumns: ["id"]
          },
        ]
      }
      garantias: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          descripcion: string | null
          estado: string
          fecha_devuelta: string | null
          fecha_recibida: string
          foto_urls: string[] | null
          id: string
          prestamo_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          estado?: string
          fecha_devuelta?: string | null
          fecha_recibida: string
          foto_urls?: string[] | null
          id?: string
          prestamo_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          estado?: string
          fecha_devuelta?: string | null
          fecha_recibida?: string
          foto_urls?: string[] | null
          id?: string
          prestamo_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garantias_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      herederos: {
        Row: {
          activo: boolean
          clave_hash: string
          created_at: string | null
          dias_inactividad: number
          id: string
          nombre: string
          prestamista_id: string
          relacion: string
          telefono: string
          ultima_actividad: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          clave_hash: string
          created_at?: string | null
          dias_inactividad?: number
          id?: string
          nombre: string
          prestamista_id: string
          relacion?: string
          telefono: string
          ultima_actividad?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          clave_hash?: string
          created_at?: string | null
          dias_inactividad?: number
          id?: string
          nombre?: string
          prestamista_id?: string
          relacion?: string
          telefono?: string
          ultima_actividad?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "herederos_prestamista_id_fkey"
            columns: ["prestamista_id"]
            isOneToOne: false
            referencedRelation: "prestamistas"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_abonos: {
        Row: {
          cliente_id: string
          created_at: string | null
          cuota_id: string | null
          deuda_id: string | null
          fecha_abono: string
          id: string
          monto: number
          notas: string | null
          tipo_aplicacion: string
          vendedor_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          cuota_id?: string | null
          deuda_id?: string | null
          fecha_abono?: string
          id?: string
          monto: number
          notas?: string | null
          tipo_aplicacion: string
          vendedor_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          cuota_id?: string | null
          deuda_id?: string | null
          fecha_abono?: string
          id?: string
          monto?: number
          notas?: string | null
          tipo_aplicacion?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_abonos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "libro_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libro_abonos_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "libro_cuotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libro_abonos_deuda_id_fkey"
            columns: ["deuda_id"]
            isOneToOne: false
            referencedRelation: "libro_deudas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libro_abonos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "libro_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_clientes: {
        Row: {
          apodo: string | null
          created_at: string | null
          foto_url: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          apodo?: string | null
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          apodo?: string | null
          created_at?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_clientes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "libro_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_cuotas: {
        Row: {
          created_at: string | null
          deuda_id: string
          estado: string
          fecha_vencimiento: string
          id: string
          monto: number
          monto_pagado: number
          numero_cuota: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deuda_id: string
          estado?: string
          fecha_vencimiento: string
          id?: string
          monto: number
          monto_pagado?: number
          numero_cuota: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deuda_id?: string
          estado?: string
          fecha_vencimiento?: string
          id?: string
          monto?: number
          monto_pagado?: number
          numero_cuota?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "libro_cuotas_deuda_id_fkey"
            columns: ["deuda_id"]
            isOneToOne: false
            referencedRelation: "libro_deudas"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_deudas: {
        Row: {
          cliente_id: string
          concepto: string
          created_at: string | null
          estado: string
          fecha_cobro: string | null
          id: string
          monto_pagado: number
          monto_total: number
          saldo_pendiente: number
          tipo_cobro: string
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          cliente_id: string
          concepto: string
          created_at?: string | null
          estado?: string
          fecha_cobro?: string | null
          id?: string
          monto_pagado?: number
          monto_total: number
          saldo_pendiente: number
          tipo_cobro: string
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          cliente_id?: string
          concepto?: string
          created_at?: string | null
          estado?: string
          fecha_cobro?: string | null
          id?: string
          monto_pagado?: number
          monto_total?: number
          saldo_pendiente?: number
          tipo_cobro?: string
          updated_at?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_deudas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "libro_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libro_deudas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "libro_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_herederos: {
        Row: {
          activo: boolean
          clave_hash: string
          created_at: string | null
          dias_inactividad: number
          id: string
          nombre: string
          relacion: string
          telefono: string
          vendedor_id: string
        }
        Insert: {
          activo?: boolean
          clave_hash: string
          created_at?: string | null
          dias_inactividad?: number
          id?: string
          nombre: string
          relacion: string
          telefono: string
          vendedor_id: string
        }
        Update: {
          activo?: boolean
          clave_hash?: string
          created_at?: string | null
          dias_inactividad?: number
          id?: string
          nombre?: string
          relacion?: string
          telefono?: string
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_herederos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: true
            referencedRelation: "libro_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_productos_deuda: {
        Row: {
          cantidad: number | null
          created_at: string | null
          deuda_id: string
          id: string
          nombre: string
          precio_unitario: number | null
          subtotal: number
        }
        Insert: {
          cantidad?: number | null
          created_at?: string | null
          deuda_id: string
          id?: string
          nombre: string
          precio_unitario?: number | null
          subtotal: number
        }
        Update: {
          cantidad?: number | null
          created_at?: string | null
          deuda_id?: string
          id?: string
          nombre?: string
          precio_unitario?: number | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "libro_productos_deuda_deuda_id_fkey"
            columns: ["deuda_id"]
            isOneToOne: false
            referencedRelation: "libro_deudas"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_transferencias: {
        Row: {
          clave_hash: string
          completada_at: string | null
          created_at: string | null
          estado: string
          id: string
          telefono_destino: string
          vendedor_destino_id: string | null
          vendedor_origen_id: string
        }
        Insert: {
          clave_hash: string
          completada_at?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          telefono_destino: string
          vendedor_destino_id?: string | null
          vendedor_origen_id: string
        }
        Update: {
          clave_hash?: string
          completada_at?: string | null
          created_at?: string | null
          estado?: string
          id?: string
          telefono_destino?: string
          vendedor_destino_id?: string | null
          vendedor_origen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_transferencias_vendedor_destino_id_fkey"
            columns: ["vendedor_destino_id"]
            isOneToOne: false
            referencedRelation: "libro_vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libro_transferencias_vendedor_origen_id_fkey"
            columns: ["vendedor_origen_id"]
            isOneToOne: false
            referencedRelation: "libro_vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_vendedores: {
        Row: {
          created_at: string | null
          id: string
          moneda: string
          nombre: string
          tipo_negocio: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          moneda?: string
          nombre: string
          tipo_negocio: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          moneda?: string
          nombre?: string
          tipo_negocio?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pagos: {
        Row: {
          cliente_id: string
          created_at: string | null
          dias_atraso_al_pagar: number
          fecha_pago: string
          id: string
          monto_capital: number
          monto_interes: number
          monto_mora: number
          monto_total: number
          prestamo_id: string
          saldo_antes: number
          saldo_despues: number
          tipo_pago: string
          client_op_id: string | null
        }
        Insert: {
          cliente_id: string
          client_op_id?: string | null
          created_at?: string | null
          dias_atraso_al_pagar?: number
          fecha_pago: string
          id?: string
          monto_capital?: number
          monto_interes?: number
          monto_mora?: number
          monto_total: number
          prestamo_id: string
          saldo_antes: number
          saldo_despues: number
          tipo_pago?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          dias_atraso_al_pagar?: number
          fecha_pago?: string
          id?: string
          monto_capital?: number
          monto_interes?: number
          monto_mora?: number
          monto_total?: number
          prestamo_id?: string
          saldo_antes?: number
          saldo_despues?: number
          tipo_pago?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      prestamistas: {
        Row: {
          cartera_activa_id: string | null
          created_at: string | null
          id: string
          metodo_seguridad: string
          moneda_principal: string
          nombre: string
          pin_hash: string
          push_token: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          cartera_activa_id?: string | null
          created_at?: string | null
          id?: string
          metodo_seguridad?: string
          moneda_principal?: string
          nombre: string
          pin_hash: string
          push_token?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          cartera_activa_id?: string | null
          created_at?: string | null
          id?: string
          metodo_seguridad?: string
          moneda_principal?: string
          nombre?: string
          pin_hash?: string
          push_token?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prestamos: {
        Row: {
          cartera_id: string
          cliente_id: string
          created_at: string | null
          cuotas_pagadas: number
          deleted_at: string | null
          dias_en_mora: number
          estado: string
          fecha_inicio: string
          fecha_proximo_pago: string
          fecha_ultimo_pago: string | null
          frecuencia_cobro: string
          id: string
          modelo_interes: string
          monto_capital: number
          num_cuotas: number
          prestamo_padre_id: string | null
          saldo_pendiente: number
          tasa_interes: number
          total_intereses_generados: number
          total_mora_generada: number
          updated_at: string | null
          client_op_id: string | null
        }
        Insert: {
          cartera_id: string
          cliente_id: string
          client_op_id?: string | null
          created_at?: string | null
          cuotas_pagadas?: number
          deleted_at?: string | null
          dias_en_mora?: number
          estado?: string
          fecha_inicio: string
          fecha_proximo_pago: string
          fecha_ultimo_pago?: string | null
          frecuencia_cobro?: string
          id?: string
          modelo_interes?: string
          monto_capital: number
          num_cuotas: number
          prestamo_padre_id?: string | null
          saldo_pendiente: number
          tasa_interes: number
          total_intereses_generados?: number
          total_mora_generada?: number
          updated_at?: string | null
        }
        Update: {
          cartera_id?: string
          cliente_id?: string
          created_at?: string | null
          cuotas_pagadas?: number
          deleted_at?: string | null
          dias_en_mora?: number
          estado?: string
          fecha_inicio?: string
          fecha_proximo_pago?: string
          fecha_ultimo_pago?: string | null
          frecuencia_cobro?: string
          id?: string
          modelo_interes?: string
          monto_capital?: number
          num_cuotas?: number
          prestamo_padre_id?: string | null
          saldo_pendiente?: number
          tasa_interes?: number
          total_intereses_generados?: number
          total_mora_generada?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestamos_cartera_id_fkey"
            columns: ["cartera_id"]
            isOneToOne: false
            referencedRelation: "carteras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamos_prestamo_padre_id_fkey"
            columns: ["prestamo_padre_id"]
            isOneToOne: false
            referencedRelation: "prestamos"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_bloqueos: {
        Row: {
          created_at: string | null
          fecha: string
          hora_fin: string
          hora_inicio: string
          id: string
          motivo: string | null
          perfil_id: string
        }
        Insert: {
          created_at?: string | null
          fecha: string
          hora_fin: string
          hora_inicio: string
          id?: string
          motivo?: string | null
          perfil_id: string
        }
        Update: {
          created_at?: string | null
          fecha?: string
          hora_fin?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_bloqueos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_citas: {
        Row: {
          atendida_at: string | null
          cancelada_by: string | null
          cliente_id: string
          confirmada_at: string | null
          created_at: string | null
          en_camino_at: string | null
          estado: string
          fecha: string
          grupo_id: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          llegada_at: string | null
          negocio_id: string
          perfil_2_id: string | null
          perfil_id: string
          servicio_2_id: string | null
          servicio_id: string
          updated_at: string | null
        }
        Insert: {
          atendida_at?: string | null
          cancelada_by?: string | null
          cliente_id: string
          confirmada_at?: string | null
          created_at?: string | null
          en_camino_at?: string | null
          estado?: string
          fecha: string
          grupo_id?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          llegada_at?: string | null
          negocio_id: string
          perfil_2_id?: string | null
          perfil_id: string
          servicio_2_id?: string | null
          servicio_id: string
          updated_at?: string | null
        }
        Update: {
          atendida_at?: string | null
          cancelada_by?: string | null
          cliente_id?: string
          confirmada_at?: string | null
          created_at?: string | null
          en_camino_at?: string | null
          estado?: string
          fecha?: string
          grupo_id?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          llegada_at?: string | null
          negocio_id?: string
          perfil_2_id?: string | null
          perfil_id?: string
          servicio_2_id?: string | null
          servicio_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turno_citas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_citas_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "turno_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_citas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_citas_perfil_2_id_fkey"
            columns: ["perfil_2_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_citas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_citas_servicio_2_id_fkey"
            columns: ["servicio_2_id"]
            isOneToOne: false
            referencedRelation: "turno_servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_citas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "turno_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_cola: {
        Row: {
          atendido_at: string | null
          cita_origen_id: string | null
          cliente_id: string
          created_at: string | null
          en_camino_at: string | null
          estado: string
          expira_at: string | null
          grupo_id: string | null
          id: string
          llamado_at: string | null
          negocio_id: string
          perfil_id: string | null
          posicion: number
          prioridad: number
          servicio_id: string
          tipo_cola: string
        }
        Insert: {
          atendido_at?: string | null
          cita_origen_id?: string | null
          cliente_id: string
          created_at?: string | null
          en_camino_at?: string | null
          estado?: string
          expira_at?: string | null
          grupo_id?: string | null
          id?: string
          llamado_at?: string | null
          negocio_id: string
          perfil_id?: string | null
          posicion: number
          prioridad?: number
          servicio_id: string
          tipo_cola: string
        }
        Update: {
          atendido_at?: string | null
          cita_origen_id?: string | null
          cliente_id?: string
          created_at?: string | null
          en_camino_at?: string | null
          estado?: string
          expira_at?: string | null
          grupo_id?: string | null
          id?: string
          llamado_at?: string | null
          negocio_id?: string
          perfil_id?: string | null
          posicion?: number
          prioridad?: number
          servicio_id?: string
          tipo_cola?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_cola_cita_origen_id_fkey"
            columns: ["cita_origen_id"]
            isOneToOne: false
            referencedRelation: "turno_citas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_cola_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_cola_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "turno_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_cola_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_cola_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_cola_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "turno_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_configuracion_negocio: {
        Row: {
          anticipacion_minima_horas: number
          asignacion_por_dueno: boolean
          doble_servicio_activo: boolean
          gracia_cita_min: number
          id: string
          negocio_id: string
          puntos_activos: boolean
          puntos_por_visita: number | null
          updated_at: string | null
          ventana_llegada_min: number
          visitas_para_gratis: number | null
        }
        Insert: {
          anticipacion_minima_horas?: number
          asignacion_por_dueno?: boolean
          doble_servicio_activo?: boolean
          gracia_cita_min?: number
          id?: string
          negocio_id: string
          puntos_activos?: boolean
          puntos_por_visita?: number | null
          updated_at?: string | null
          ventana_llegada_min?: number
          visitas_para_gratis?: number | null
        }
        Update: {
          anticipacion_minima_horas?: number
          asignacion_por_dueno?: boolean
          doble_servicio_activo?: boolean
          gracia_cita_min?: number
          id?: string
          negocio_id?: string
          puntos_activos?: boolean
          puntos_por_visita?: number | null
          updated_at?: string | null
          ventana_llegada_min?: number
          visitas_para_gratis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turno_configuracion_negocio_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_eventos_log: {
        Row: {
          created_at: string | null
          evento: string
          id: string
          metadata: string | null
          negocio_id: string
          perfil_id: string | null
          referencia_id: string | null
          tipo_referencia: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          evento: string
          id?: string
          metadata?: string | null
          negocio_id: string
          perfil_id?: string | null
          referencia_id?: string | null
          tipo_referencia?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          evento?: string
          id?: string
          metadata?: string | null
          negocio_id?: string
          perfil_id?: string | null
          referencia_id?: string | null
          tipo_referencia?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turno_eventos_log_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_eventos_log_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_eventos_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_grupos: {
        Row: {
          ajustado_por: string | null
          confirmado_parcial: boolean
          created_at: string | null
          estado: string
          id: string
          lider_id: string
          mismo_barbero: boolean
          negocio_id: string
          perfil_id: string | null
          personas_presentes: number | null
          total_personas: number
          updated_at: string | null
        }
        Insert: {
          ajustado_por?: string | null
          confirmado_parcial?: boolean
          created_at?: string | null
          estado?: string
          id?: string
          lider_id: string
          mismo_barbero?: boolean
          negocio_id: string
          perfil_id?: string | null
          personas_presentes?: number | null
          total_personas?: number
          updated_at?: string | null
        }
        Update: {
          ajustado_por?: string | null
          confirmado_parcial?: boolean
          created_at?: string | null
          estado?: string
          id?: string
          lider_id?: string
          mismo_barbero?: boolean
          negocio_id?: string
          perfil_id?: string | null
          personas_presentes?: number | null
          total_personas?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turno_grupos_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_grupos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_grupos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_historial_visitas: {
        Row: {
          cliente_id: string
          created_at: string | null
          duracion_real_min: number | null
          fecha: string
          id: string
          negocio_id: string
          origen: string
          perfil_id: string
          precio_cobrado: number
          servicio_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          duracion_real_min?: number | null
          fecha: string
          id?: string
          negocio_id: string
          origen: string
          perfil_id: string
          precio_cobrado: number
          servicio_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          duracion_real_min?: number | null
          fecha?: string
          id?: string
          negocio_id?: string
          origen?: string
          perfil_id?: string
          precio_cobrado?: number
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_historial_visitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_historial_visitas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_historial_visitas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_historial_visitas_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "turno_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_horarios: {
        Row: {
          activo: boolean
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          perfil_id: string
          tiempo_entre_clientes: number
        }
        Insert: {
          activo?: boolean
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id?: string
          perfil_id: string
          tiempo_entre_clientes?: number
        }
        Update: {
          activo?: boolean
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          perfil_id?: string
          tiempo_entre_clientes?: number
        }
        Relationships: [
          {
            foreignKeyName: "turno_horarios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_membresias: {
        Row: {
          activo: boolean
          created_at: string | null
          id: string
          negocio_id: string
          rol: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          id?: string
          negocio_id: string
          rol: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          id?: string
          negocio_id?: string
          rol?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_membresias_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_membresias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_negocios: {
        Row: {
          activo: boolean
          codigo_acceso: string
          created_at: string | null
          direccion: string | null
          id: string
          moneda: string
          nombre: string
          telefono: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          codigo_acceso: string
          created_at?: string | null
          direccion?: string | null
          id?: string
          moneda?: string
          nombre: string
          telefono?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          codigo_acceso?: string
          created_at?: string | null
          direccion?: string | null
          id?: string
          moneda?: string
          nombre?: string
          telefono?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      turno_notas_privadas: {
        Row: {
          cliente_id: string
          id: string
          nota: string
          perfil_id: string
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          id?: string
          nota: string
          perfil_id: string
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          id?: string
          nota?: string
          perfil_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turno_notas_privadas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_notas_privadas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_perfiles: {
        Row: {
          activo: boolean
          aprobado: boolean
          created_at: string | null
          domicilio_activo: boolean
          estado_actual: string
          foto_url: string | null
          id: string
          negocio_id: string
          tipo_servicio: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          aprobado?: boolean
          created_at?: string | null
          domicilio_activo?: boolean
          estado_actual?: string
          foto_url?: string | null
          id?: string
          negocio_id: string
          tipo_servicio: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          activo?: boolean
          aprobado?: boolean
          created_at?: string | null
          domicilio_activo?: boolean
          estado_actual?: string
          foto_url?: string | null
          id?: string
          negocio_id?: string
          tipo_servicio?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_perfiles_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_perfiles_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_preferencias_cliente: {
        Row: {
          alergias: string | null
          barba: string | null
          foto_referencia_url: string | null
          id: string
          largo: string | null
          negocio_id: string
          notas: string | null
          perfil_preferido_id: string | null
          tipo_corte: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          alergias?: string | null
          barba?: string | null
          foto_referencia_url?: string | null
          id?: string
          largo?: string | null
          negocio_id: string
          notas?: string | null
          perfil_preferido_id?: string | null
          tipo_corte?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          alergias?: string | null
          barba?: string | null
          foto_referencia_url?: string | null
          id?: string
          largo?: string | null
          negocio_id?: string
          notas?: string | null
          perfil_preferido_id?: string | null
          tipo_corte?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_preferencias_cliente_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_preferencias_cliente_perfil_preferido_id_fkey"
            columns: ["perfil_preferido_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_preferencias_cliente_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_puntos: {
        Row: {
          id: string
          negocio_id: string
          puntos_canjeados: number
          puntos_totales: number
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          id?: string
          negocio_id: string
          puntos_canjeados?: number
          puntos_totales?: number
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          id?: string
          negocio_id?: string
          puntos_canjeados?: number
          puntos_totales?: number
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_puntos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "turno_negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_puntos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_resenas: {
        Row: {
          cliente_id: string
          comentario: string | null
          created_at: string | null
          id: string
          perfil_id: string
          rating: number
          visita_id: string
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          perfil_id: string
          rating: number
          visita_id: string
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          created_at?: string | null
          id?: string
          perfil_id?: string
          rating?: number
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turno_resenas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "turno_usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_resenas_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turno_resenas_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: true
            referencedRelation: "turno_historial_visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_servicios: {
        Row: {
          activo: boolean
          created_at: string | null
          duracion_min: number
          id: string
          nombre: string
          perfil_id: string
          precio: number
        }
        Insert: {
          activo?: boolean
          created_at?: string | null
          duracion_min: number
          id?: string
          nombre: string
          perfil_id: string
          precio: number
        }
        Update: {
          activo?: boolean
          created_at?: string | null
          duracion_min?: number
          id?: string
          nombre?: string
          perfil_id?: string
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "turno_servicios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "turno_perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turno_usuarios: {
        Row: {
          abandonos: number
          created_at: string | null
          id: string
          llegadas_tarde: number
          no_shows: number
          nombre: string
          telefono: string
          tipo_usuario: string
          updated_at: string | null
        }
        Insert: {
          abandonos?: number
          created_at?: string | null
          id?: string
          llegadas_tarde?: number
          no_shows?: number
          nombre: string
          telefono: string
          tipo_usuario: string
          updated_at?: string | null
        }
        Update: {
          abandonos?: number
          created_at?: string | null
          id?: string
          llegadas_tarde?: number
          no_shows?: number
          nombre?: string
          telefono?: string
          tipo_usuario?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acceso_heredero: {
        Args: { p_clave_hash: string; p_telefono: string }
        Returns: Json
      }
      anular_pago: { Args: { p_pago_id: string }; Returns: undefined }
      es_colaborador: { Args: { cid: string }; Returns: boolean }
      es_mi_cartera: { Args: { cid: string }; Returns: boolean }
      es_mi_prestamo: { Args: { pid: string }; Returns: boolean }
      invitar_colaborador: {
        Args: { p_cartera_id: string; p_email: string }
        Returns: string
      }
      marcar_vencidos: { Args: never; Returns: undefined }
      soy_dueno_cartera: { Args: { cid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
