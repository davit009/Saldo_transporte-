import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/Nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Asegura que exista una fila de configuración para el usuario.
  await supabase
    .from('transporte_config')
    .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

  // Procesa descuentos automáticos vencidos como respaldo del cron de Supabase.
  // Se ignora el error si la migración 002 aún no se ha ejecutado.
  await supabase.rpc('transporte_procesar_descuentos');

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
