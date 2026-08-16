'use client';

import { useActionState } from 'react';
import { registrarRecarga } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RecargaForm() {
  const [state, formAction, pending] = useActionState(registrarRecarga, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="monto-recarga">
            Monto
          </label>
          <Input
            id="monto-recarga"
            name="monto"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="100.00"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="desc-recarga">
            Nota (opcional)
          </label>
          <Input id="desc-recarga" name="descripcion" placeholder="Recarga en taquilla" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Registrando…' : 'Registrar recarga'}
      </Button>
    </form>
  );
}
