'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/weekly-plan', label: 'Weekly Plan', icon: '📅' },
  { href: '/cook', label: 'Cook', icon: '🍳' },
  { href: '/recipe-bank', label: 'Recipe Bank', icon: '📖' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-surface-2 border-r border-border px-4 py-6 fixed left-0 top-0">
      <div className="mb-8">
        <span className="text-xl font-bold text-accent tracking-tight">🔪 Carmy</span>
        <p className="text-xs text-muted mt-1">AI Chef & Nutritionist</p>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent/20 text-accent'
                  : 'text-muted hover:text-foreground hover:bg-surface-3'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-4 mt-4">
        <p className="text-xs text-muted">Daily targets</p>
        <p className="text-sm text-foreground font-mono mt-1">1,750 kcal · 160g protein</p>
        <p className="text-xs text-muted mt-1">Pescatarian · Lactose-Free</p>
      </div>
    </aside>
  );
}
