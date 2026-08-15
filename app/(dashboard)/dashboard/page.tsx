import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { formatMonto, formatFecha, DIAS_SEMANA, TIPO_LABEL } from '@/lib/format';
import type { TransporteConfig, TransporteHorario, TransporteMovimiento } from '@/lib/types';
import { RecargaForm } from './RecargaForm';
import { AjusteForm } from './AjusteForm';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: config }, { data: horarios }, { data: movimientos }] = await Promise.all([
    supabase
      .from('transporte_config')
      .select('*')
      .eq('user_id', user!.id)
      .single<TransporteConfig>(),
    supabase
      .from('transporte_horarios')
      .select('*')
      .eq('user_id', user!.id)
      .eq('activo', true)
      .order('hora')
      .returns<TransporteHorario[]>(),
    supabase
      .from('transporte_movimientos')
      .select('*')
      .eq('user_id', user!.id)
      .order('fecha', { ascending: false })
      .limit(5)
      .returns<TransporteMovimiento[]>(),
  ]);

  const moneda = config?.moneda ?? 'MXN';
  const saldo = config?.saldo_actual ?? 0;
  const sinCostoConfigurado = !config || Number(config.costo_viaje) <= 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Saldo estimado</p>
        <p className={`mt-1 text-4xl font-black ${saldo < 0 ? 'text-destructive' : ''}`}>
          {formatMonto(saldo, moneda)}
        </p>
        {sinCostoConfigurado && (
          <p className="mt-3 text-sm text-muted-foreground">
            Aún no configuras el costo del viaje.{' '}
            <Link href="/configuracion" className="text-primary font-semibold hover:underline">
              Configúralo aquí
            </Link>
          </p>
        )}
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Registrar recarga</h2>
          <RecargaForm />
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Ajuste por uso inusual</h2>
          <AjusteForm />
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Horarios activos</h2>
          <Link href="/horarios" className="text-sm text-primary font-semibold hover:underline">
            Administrar
          </Link>
        </div>
        {!horarios || horarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tienes horarios programados todavía.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {horarios.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{h.hora.slice(0, 5)}</span>
                <span className="text-muted-foreground">
                  {h.dias_semana
                    .slice()
                    .sort((a, b) => a - b)
                    .map((d) => DIAS_SEMANA[d].label)
                    .join(', ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Movimientos recientes</h2>
          <Link href="/historial" className="text-sm text-primary font-semibold hover:underline">
            Ver historial
          </Link>
        </div>
        {!movimientos || movimientos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay movimientos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{TIPO_LABEL[m.tipo]}</p>
                  <p className="text-muted-foreground">{formatFecha(m.fecha)}</p>
                </div>
                <span className={m.monto >= 0 ? 'text-success font-semibold' : 'font-semibold'}>
                  {m.monto >= 0 ? '+' : ''}
                  {formatMonto(m.monto, moneda)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
