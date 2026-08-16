'use client';

import { useActionState } from 'react';
import { registrarAjuste } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AjusteForm() {
  const [state, formAction, pending] = useActionState(registrarAjuste, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="desc-ajuste">
          Nota (opcional)
        </label>
        <Input id="desc-ajuste" name="descripcion" placeholder="Ej. fui al doctor" />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="submit"
          name="direccion"
          value="extra"
          variant="secondary"
          disabled={pending}
        >
          + Viaje extra hoy
        </Button>
        <Button
          type="submit"
          name="direccion"
          value="faltante"
          variant="secondary"
          disabled={pending}
        >
          − Viaje que no hice
        </Button>
      </div>
    </form>
  );
}
