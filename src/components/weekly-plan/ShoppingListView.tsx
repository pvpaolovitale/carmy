'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SubstitutionSuggestion, IngredientSubResponse } from '@/types';
import Spinner from '@/components/ui/Spinner';

const sectionEmoji: Record<string, string> = {
  fish_seafood: '🐟',
  produce: '🥦',
  dairy_alternatives: '🧊',
  pantry: '🫙',
  frozen: '❄️',
  spices_condiments: '🧂',
  other: '🛒',
};

const sectionLabel: Record<string, { en: string; es: string }> = {
  fish_seafood: { en: 'Fish Counter', es: 'Pescadería' },
  produce: { en: 'Produce', es: 'Frutas y Verduras' },
  dairy_alternatives: { en: 'Refrigerated', es: 'Refrigerados' },
  pantry: { en: 'Pantry', es: 'Despensa' },
  frozen: { en: 'Frozen', es: 'Congelados' },
  spices_condiments: { en: 'Spices & Condiments', es: 'Especias y Condimentos' },
  other: { en: 'Other', es: 'Otros' },
};

interface SubState {
  open: boolean;
  context: string;
  loading: boolean;
  suggestions: SubstitutionSuggestion[];
  feedback: string;
  refining: boolean;
}

const defaultSubState = (): SubState => ({
  open: false,
  context: '',
  loading: false,
  suggestions: [],
  feedback: '',
  refining: false,
});

export default function ShoppingListView({ weeklyPlanId }: { weeklyPlanId: string }) {
  const rawItems = useQuery(api.weeklyPlans.getShoppingItems, {
    weeklyPlanId: weeklyPlanId as Id<'weeklyPlans'>,
  });

  const toggle = useMutation(api.weeklyPlans.toggleShoppingItem);
  const acceptSubMutation = useMutation(api.weeklyPlans.acceptSubstitution);

  // Per-item substitution UI state (transient, not persisted)
  const [subStates, setSubStates] = useState<Record<string, SubState>>({});

  if (rawItems === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!rawItems || rawItems.length === 0) {
    return <p className="text-muted text-sm">Shopping list is empty.</p>;
  }

  // Group items by section
  const grouped: Record<string, typeof rawItems> = {};
  for (const item of rawItems) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }

  const sectionOrder = ['fish_seafood', 'produce', 'dairy_alternatives', 'pantry', 'frozen', 'spices_condiments', 'other'];

  const getSubState = (id: string): SubState => subStates[id] ?? defaultSubState();
  const setSubState = (id: string, patch: Partial<SubState>) => {
    setSubStates((prev) => ({ ...prev, [id]: { ...(prev[id] ?? defaultSubState()), ...patch } }));
  };

  const handleAskCarmy = async (itemId: string, nameEn: string, nameEs: string, quantity: string) => {
    const sub = getSubState(itemId);
    setSubState(itemId, { loading: true });
    try {
      const res = await fetch('/api/ingredient-sub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalItem: { nameEn, nameEs, quantity },
          userContext: sub.context || undefined,
          previousSuggestions: sub.suggestions.length > 0 ? sub.suggestions : undefined,
          feedback: sub.refining && sub.feedback ? sub.feedback : undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to get suggestions');
      const data: IngredientSubResponse = await res.json();
      setSubState(itemId, { suggestions: data.suggestions, loading: false, refining: false, feedback: '' });
    } catch {
      setSubState(itemId, { loading: false });
    }
  };

  const handleAcceptSub = async (
    itemId: string,
    originalItem: { nameEn: string; nameEs: string; quantity: string },
    suggestion: SubstitutionSuggestion,
  ) => {
    await acceptSubMutation({
      itemId: itemId as Id<'shoppingItems'>,
      substitution: {
        originalNameEn: originalItem.nameEn,
        originalNameEs: originalItem.nameEs,
        originalQuantity: originalItem.quantity,
        newNameEn: suggestion.nameEn,
        newNameEs: suggestion.nameEs,
        newQuantity: suggestion.quantity,
        acceptedAt: new Date().toISOString(),
      },
    });
    // Close substitution panel
    setSubState(itemId, defaultSubState());
  };

  const copyToClipboard = () => {
    const text = sectionOrder
      .filter((s) => grouped[s])
      .flatMap((s) => {
        const emoji = sectionEmoji[s] ?? '🛒';
        const label = sectionLabel[s] ?? { en: s, es: s };
        return [
          `${emoji} ${label.en} / ${label.es}`,
          ...grouped[s].map((item) => {
            if (item.substitution) {
              return `  • ~~${item.substitution.originalNameEn}~~ → ${item.substitution.newNameEn} — ${item.substitution.newQuantity}`;
            }
            return `  • ${item.nameEn} / ${item.nameEs} — ${item.quantity}`;
          }),
          '',
        ];
      })
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">🛍 Shopping List</h2>
        <button
          onClick={copyToClipboard}
          className="text-xs text-muted hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors"
        >
          📋 Copy
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {sectionOrder.filter((s) => grouped[s]).map((section) => {
          const label = sectionLabel[section] ?? { en: section, es: section };
          const emoji = sectionEmoji[section] ?? '🛒';
          return (
            <div key={section}>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {emoji} {label.en} / {label.es}
              </h3>
              <ul className="flex flex-col gap-1">
                {grouped[section].map((item) => {
                  const itemId = item._id as string;
                  const sub = getSubState(itemId);
                  const hasSub = !!item.substitution;
                  const done = item.checked;

                  return (
                    <li key={itemId} className="rounded-lg border border-transparent">
                      {/* Main item row */}
                      <div
                        onClick={() => toggle({ itemId: itemId as Id<'shoppingItems'>, checked: !done })}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          done ? 'opacity-40 bg-surface-3' : 'hover:bg-surface-3'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${done ? 'bg-green-600 border-green-600' : 'border-border'}`}>
                          {done && '✓'}
                        </span>

                        <span className="flex-1 text-sm">
                          {hasSub ? (
                            <>
                              <span className="line-through text-muted mr-1">{item.substitution!.originalNameEn}</span>
                              <span className="text-accent font-medium">→ {item.substitution!.newNameEn}</span>
                              <span className="text-muted"> / {item.substitution!.newNameEs}</span>
                            </>
                          ) : (
                            <>
                              <span className={done ? 'line-through text-muted' : 'text-foreground'}>{item.nameEn}</span>
                              <span className="text-muted"> / {item.nameEs}</span>
                            </>
                          )}
                        </span>

                        <span className="text-xs font-mono text-muted">
                          {hasSub ? item.substitution!.newQuantity : item.quantity}
                        </span>

                        {/* "Not available?" button */}
                        {!hasSub && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubState(itemId, { open: !sub.open });
                            }}
                            className="text-xs text-muted/60 hover:text-accent ml-1 flex-shrink-0 transition-colors"
                            title="Can't find this item?"
                          >
                            ?
                          </button>
                        )}
                      </div>

                      {/* Substitution panel */}
                      {sub.open && !hasSub && (
                        <div
                          className="mx-2 mb-2 p-3 bg-surface-2 border border-border rounded-lg flex flex-col gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-semibold text-foreground">
                            🔄 Can&apos;t find <span className="text-accent">{item.nameEn}</span>?
                          </p>

                          {sub.suggestions.length === 0 ? (
                            <>
                              <input
                                type="text"
                                value={sub.context}
                                onChange={(e) => setSubState(itemId, { context: e.target.value })}
                                placeholder="Any context? e.g. out of stock, budget under €5 (optional)"
                                className="text-xs bg-surface-1 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50"
                              />
                              <button
                                onClick={() => handleAskCarmy(itemId, item.nameEn, item.nameEs, item.quantity)}
                                disabled={sub.loading}
                                className="flex items-center justify-center gap-2 text-xs font-semibold bg-accent text-black px-3 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors"
                              >
                                {sub.loading ? <><Spinner size="sm" /> Asking Carmy...</> : '👨‍🍳 Ask Carmy'}
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col gap-2">
                                {sub.suggestions.map((suggestion, i) => (
                                  <div key={i} className="border border-border rounded-lg p-2 flex flex-col gap-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-medium text-foreground">
                                          {suggestion.nameEn}
                                          <span className="text-muted font-normal"> / {suggestion.nameEs}</span>
                                        </p>
                                        <p className="text-xs font-mono text-muted">{suggestion.quantity}</p>
                                        <p className="text-xs text-muted/70 mt-0.5">{suggestion.rationale}</p>
                                      </div>
                                      <button
                                        onClick={() => handleAcceptSub(itemId, { nameEn: item.nameEn, nameEs: item.nameEs, quantity: item.quantity }, suggestion)}
                                        className="flex-shrink-0 text-xs font-semibold text-green-400 border border-green-600/40 px-2 py-1 rounded hover:border-green-400 transition-colors"
                                      >
                                        Use this ✓
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Refine section */}
                              {!sub.refining ? (
                                <button
                                  onClick={() => setSubState(itemId, { refining: true })}
                                  className="text-xs text-muted hover:text-accent transition-colors self-start"
                                >
                                  Not quite right? Tell Carmy why... →
                                </button>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <textarea
                                    value={sub.feedback}
                                    onChange={(e) => setSubState(itemId, { feedback: e.target.value })}
                                    placeholder="What didn't work? e.g. too expensive, can't find that either..."
                                    rows={2}
                                    className="text-xs bg-surface-1 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 resize-none"
                                  />
                                  <button
                                    onClick={() => handleAskCarmy(itemId, item.nameEn, item.nameEs, item.quantity)}
                                    disabled={sub.loading}
                                    className="flex items-center justify-center gap-2 text-xs font-semibold bg-accent text-black px-3 py-2 rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors"
                                  >
                                    {sub.loading ? <><Spinner size="sm" /> Thinking...</> : '🔄 Try Again'}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
