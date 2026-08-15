'use client';

import { useTransition } from 'react';
import { eliminarHorario, alternarHorario } from './actions';
import { Button } from '@/components/ui/button';
import { DIAS_SEMANA } from '@/lib/format';
import type { TransporteHorario } from '@/lib/types';

export function HorarioList({ horarios }: { horarios: TransporteHorario[] }) {
  const [isPending, startTransition] = useTransition();

  if (horarios.length === 0) {
    return <p className="text-sm text-muted-foreground">No tienes horarios programados.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {horarios.map((h) => (
        <li key={h.id} className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className={`font-medium ${!h.activo ? 'text-muted-foreground line-through' : ''}`}>
              {h.hora.slice(0, 5)}
            </p>
            <p className="text-sm text-muted-foreground">
              {h.dias_semana
                .slice()
                .sort((a, b) => a - b)
                .map((d) => DIAS_SEMANA[d].label)
                .join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => startTransition(() => alternarHorario(h.id, !h.activo))}
            >
              {h.activo ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => startTransition(() => eliminarHorario(h.id))}
            >
              Eliminar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
