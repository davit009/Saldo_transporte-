'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionState } from '../dashboard/actions';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return { supabase, user };
}

export async function crearHorario(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const hora = String(formData.get('hora'));
  const dias = formData.getAll('dias').map(Number);

  if (!hora) return { error: 'Selecciona una hora.' };
  if (dias.length === 0) return { error: 'Selecciona al menos un día de la semana.' };

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from('transporte_horarios').insert({
    user_id: user.id,
    hora,
    dias_semana: dias,
  });

  if (error) return { error: error.message };

  revalidatePath('/horarios');
  revalidatePath('/dashboard');
  return null;
}

export async function eliminarHorario(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from('transporte_horarios').delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/horarios');
  revalidatePath('/dashboard');
}

export async function alternarHorario(id: string, activo: boolean) {
  const { supabase, user } = await requireUser();
  await supabase
    .from('transporte_horarios')
    .update({ activo })
    .eq('id', id)
    .eq('user_id', user.id);
  revalidatePath('/horarios');
  revalidatePath('/dashboard');
}
