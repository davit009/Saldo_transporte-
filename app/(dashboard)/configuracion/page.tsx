import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import type { TransporteConfig } from '@/lib/types';
import { ConfigForm } from './ConfigForm';

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: config } = await supabase
    .from('transporte_config')
    .select('*')
    .eq('user_id', user!.id)
    .single<TransporteConfig>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Ajusta el costo de tu viaje y, si hace falta, corrige el saldo estimado.
        </p>
      </div>

      <Card className="p-5">
        {config && <ConfigForm config={config} />}
      </Card>
    </div>
  );
}
