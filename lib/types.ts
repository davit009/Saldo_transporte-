// ============================================================
// lib/types.ts
// Tipos que reflejan las tablas transporte_* de Supabase.
// ============================================================

export type TipoMovimiento = 'recarga' | 'viaje_automatico' | 'viaje_manual' | 'ajuste';

export interface TransporteConfig {
  id: string;
  user_id: string;
  costo_viaje: number;
  saldo_actual: number;
  moneda: string;
  created_at: string;
  updated_at: string;
}

export interface TransporteHorario {
  id: string;
  user_id: string;
  hora: string; // "HH:MM:SS"
  dias_semana: number[]; // 0=domingo ... 6=sábado
  activo: boolean;
  created_at: string;
}

export interface TransporteMovimiento {
  id: string;
  user_id: string;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string | null;
  fecha: string;
  horario_id: string | null;
}
