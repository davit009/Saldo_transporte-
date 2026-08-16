'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionState } from '../dashboard/actions';

export async function actualizarConfig(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const costoViaje = Number(formData.get('costo_viaje'));
  const moneda = String(formData.get('moneda') || 'MXN').toUpperCase().slice(0, 3);
  const saldoActual = formData.get('saldo_actual');

  if (!Number.isFinite(costoViaje) || costoViaje < 0) {
    return { error: 'Ingresa un costo de viaje válido.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const update: Record<string, unknown> = { costo_viaje: costoViaje, moneda };

  if (saldoActual !== null && String(saldoActual).trim() !== '') {
    const nuevoSaldo = Number(saldoActual);
    if (!Number.isFinite(nuevoSaldo)) {
      return { error: 'El saldo actual debe ser un número válido.' };
    }

    const { data: actual } = await supabase
      .from('transporte_config')
      .select('saldo_actual')
      .eq('user_id', user.id)
      .single();

    const diferencia = nuevoSaldo - Number(actual?.saldo_actual ?? 0);
    if (diferencia !== 0) {
      await supabase.from('transporte_movimientos').insert({
        user_id: user.id,
        tipo: 'ajuste',
        monto: diferencia,
        descripcion: 'Corrección manual de saldo',
      });
    }
  }

  const { error } = await supabase
    .from('transporte_config')
    .update(update)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/configuracion');
  revalidatePath('/dashboard');
  return null;
}
