'use client';

import { ShoppingList } from '@/types';
import { useState } from 'react';

const sectionEmoji: Record<string, string> = {
  fish_seafood: '🐟',
  produce: '🥦',
  dairy_alternatives: '🧊',
  pantry: '🫙',
  frozen: '❄️',
  spices_condiments: '🧂',
  other: '🛒',
};

export default function ShoppingListView({ list }: { list: ShoppingList }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyToClipboard = () => {
    const text = list.sections
      .flatMap((s) => [
        `${sectionEmoji[s.section] ?? '🛒'} ${s.labelEn} / ${s.labelEs}`,
        ...s.items.map((i) => `  • ${i.nameEn} / ${i.nameEs} — ${i.quantity}`),
        '',
      ])
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Shopping List</h2>
        <button
          onClick={copyToClipboard}
          className="text-xs text-muted hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors"
        >
          📋 Copy
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {list.sections.map((section) => (
          <div key={section.section}>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {sectionEmoji[section.section]} {section.labelEn} / {section.labelEs}
            </h3>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const key = `${section.section}-${item.nameEn}`;
                const done = checked.has(key);
                return (
                  <li
                    key={key}
                    onClick={() => toggle(key)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      done ? 'opacity-40 bg-surface-3' : 'hover:bg-surface-3'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${done ? 'bg-green-600 border-green-600' : 'border-border'}`}>
                      {done && '✓'}
                    </span>
                    <span className="flex-1 text-sm">
                      <span className={done ? 'line-through text-muted' : 'text-foreground'}>{item.nameEn}</span>
                      <span className="text-muted"> / {item.nameEs}</span>
                    </span>
                    <span className="text-xs font-mono text-muted">{item.quantity}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
