'use client';

import { useActionState } from 'react';
import { actualizarConfig } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TransporteConfig } from '@/lib/types';

export function ConfigForm({ config }: { config: TransporteConfig }) {
  const [state, formAction, pending] = useActionState(actualizarConfig, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="costo_viaje">
            Costo por viaje
          </label>
          <Input
            id="costo_viaje"
            name="costo_viaje"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={config.costo_viaje}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="moneda">
            Moneda
          </label>
          <Input id="moneda" name="moneda" maxLength={3} defaultValue={config.moneda} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="saldo_actual">
          Corregir saldo actual (opcional)
        </label>
        <Input
          id="saldo_actual"
          name="saldo_actual"
          type="number"
          step="0.01"
          placeholder={String(config.saldo_actual)}
        />
        <p className="text-xs text-muted-foreground">
          Déjalo vacío si no necesitas corregir el saldo estimado. Si lo llenas, se registrará un
          ajuste en el historial con la diferencia.
        </p>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
