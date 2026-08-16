import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { formatMonto, formatFecha, TIPO_LABEL } from '@/lib/format';
import type { TransporteConfig, TransporteMovimiento } from '@/lib/types';

export default async function HistorialPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: config }, { data: movimientos }] = await Promise.all([
    supabase
      .from('transporte_config')
      .select('moneda')
      .eq('user_id', user!.id)
      .single<Pick<TransporteConfig, 'moneda'>>(),
    supabase
      .from('transporte_movimientos')
      .select('*')
      .eq('user_id', user!.id)
      .order('fecha', { ascending: false })
      .limit(200)
      .returns<TransporteMovimiento[]>(),
  ]);

  const moneda = config?.moneda ?? 'MXN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Historial de movimientos</h1>
        <p className="text-sm text-muted-foreground">
          Recargas, descuentos automáticos y ajustes manuales, del más reciente al más antiguo.
        </p>
      </div>

      <Card className="divide-y divide-border">
        {!movimientos || movimientos.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">Todavía no hay movimientos.</p>
        ) : (
          movimientos.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{TIPO_LABEL[m.tipo]}</p>
                {m.descripcion && (
                  <p className="text-sm text-muted-foreground">{m.descripcion}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatFecha(m.fecha)}</p>
              </div>
              <span
                className={`shrink-0 font-semibold ${m.monto >= 0 ? 'text-success' : ''}`}
              >
                {m.monto >= 0 ? '+' : ''}
                {formatMonto(m.monto, moneda)}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
