'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/(dashboard)/actions';
import { Button } from '@/components/ui/button';

const LINKS = [
  { href: '/dashboard', label: 'Saldo' },
  { href: '/horarios', label: 'Horarios' },
  { href: '/historial', label: 'Historial' },
  { href: '/configuracion', label: 'Configuración' },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold">🚌 Saldo Transporte</span>
          <nav className="hidden sm:flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            Salir
          </Button>
        </form>
      </div>
      <nav className="flex sm:hidden items-center gap-1 px-4 pb-3 overflow-x-auto">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === link.href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
