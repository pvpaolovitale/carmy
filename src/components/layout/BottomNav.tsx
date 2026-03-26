'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/weekly-plan', label: 'Plan', icon: '📅' },
  { href: '/cook', label: 'Cook', icon: '🍳' },
  { href: '/recipe-bank', label: 'Recipes', icon: '📖' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-2 border-t border-border flex">
      {nav.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors ${
              active ? 'text-accent' : 'text-muted'
            }`}
          >
            <span className="text-lg leading-none">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
