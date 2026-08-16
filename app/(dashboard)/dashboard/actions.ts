'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error?: string } | null;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return { supabase, user };
}

export async function registrarRecarga(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const monto = Number(formData.get('monto'));
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null;

  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: 'Ingresa un monto de recarga válido, mayor a cero.' };
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from('transporte_movimientos').insert({
    user_id: user.id,
    tipo: 'recarga',
    monto,
    descripcion: descripcion ?? 'Recarga manual',
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/historial');
  return null;
}

export async function registrarAjuste(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const direccion = String(formData.get('direccion'));
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null;

  const { supabase, user } = await requireUser();

  const { data: config, error: configError } = await supabase
    .from('transporte_config')
    .select('costo_viaje')
    .eq('user_id', user.id)
    .single();

  if (configError || !config) {
    return { error: 'Configura primero el costo de viaje en Configuración.' };
  }

  const costoViaje = Number(config.costo_viaje);
  if (!costoViaje || costoViaje <= 0) {
    return { error: 'Configura primero un costo de viaje mayor a cero.' };
  }

  const monto = direccion === 'extra' ? -costoViaje : costoViaje;

  const { error } = await supabase.from('transporte_movimientos').insert({
    user_id: user.id,
    tipo: 'viaje_manual',
    monto,
    descripcion:
      descripcion ??
      (direccion === 'extra' ? 'Viaje extra no programado' : 'Viaje programado no realizado'),
  });

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/historial');
  return null;
}
