'use client';

import { useState } from 'react';
import { Recipe, DinnerSlot, DayOfWeek, ShoppingList, GeneratePlanResponse } from '@/types';
import MealSlotCard from '@/components/weekly-plan/MealSlotCard';
import ShoppingListView from '@/components/weekly-plan/ShoppingListView';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

type Phase = 'idle' | 'loading' | 'review' | 'shopping-loading' | 'shopping';

export default function WeeklyPlanPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [slots, setSlots] = useState<DinnerSlot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [rationale, setRationale] = useState('');
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const allConfirmed = slots.length === 4 && slots.every((s) => s.confirmed);

  const generatePlan = async (excludeIds: string[] = []) => {
    setError('');
    setPhase('loading');
    try {
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeRecipeIds: excludeIds }),
      });

      if (!planRes.ok) {
        const err = await planRes.json();
        throw new Error(err.error || 'Failed to generate plan');
      }

      const plan: GeneratePlanResponse = await planRes.json();

      // Fetch full recipe data
      const allRecipesRes = await fetch('/api/recipes');
      const allRecipes: Recipe[] = await allRecipesRes.json();
      setRecipes(allRecipes);

      const newSlots: DinnerSlot[] = plan.selectedRecipeIds.map((id, i) => ({
        day: DAYS[i],
        recipeId: id,
        recipe: allRecipes.find((r) => r.id === id),
        confirmed: false,
      }));

      setSlots(newSlots);
      setRationale(plan.rationale);
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('idle');
    }
  };

  const swapSlot = async (idx: number) => {
    setSwappingIdx(idx);
    const currentIds = slots.map((s) => s.recipeId);

    try {
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeRecipeIds: currentIds }),
      });

      if (!planRes.ok) throw new Error('Failed to swap');
      const plan: GeneratePlanResponse = await planRes.json();
      const newId = plan.selectedRecipeIds[0];
      const newRecipe = recipes.find((r) => r.id === newId);

      setSlots((prev) =>
        prev.map((s, i) =>
          i === idx ? { ...s, recipeId: newId, recipe: newRecipe, confirmed: false } : s
        )
      );
    } catch {
      setError('Could not swap recipe. Try again.');
    } finally {
      setSwappingIdx(null);
    }
  };

  const confirmSlot = (idx: number) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, confirmed: true } : s)));
  };

  const generateShoppingList = async () => {
    setPhase('shopping-loading');
    setError('');
    try {
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds: slots.map((s) => s.recipeId) }),
      });

      if (!res.ok) throw new Error('Failed to generate shopping list');
      const list: ShoppingList = await res.json();
      setShoppingList(list);
      setPhase('shopping');
    } catch {
      setError('Could not generate shopping list. Try again.');
      setPhase('review');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">📅 Weekly Plan</h1>
        <p className="text-muted text-sm mt-1">4 dinners · Cook Once, Eat Twice · bilingual shopping list</p>
      </div>

      {phase === 'idle' && (
        <div className="bg-surface-2 border border-border rounded-xl p-8 text-center">
          <p className="text-4xl mb-4">🧑‍🍳</p>
          <p className="text-foreground font-semibold mb-2">Ready to plan your week?</p>
          <p className="text-muted text-sm mb-6">Carmy will pick 4 balanced dinners from your recipe bank.</p>
          <Button onClick={() => generatePlan()} size="lg">Generate Plan</Button>
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-16">
          <Spinner size="lg" />
          <p className="text-muted text-sm">Carmy is picking your dinners...</p>
        </div>
      )}

      {(phase === 'review' || phase === 'shopping-loading') && slots.length > 0 && (
        <>
          {rationale && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              <p className="text-xs text-amber-400 font-semibold mb-1">👨‍🍳 Carmy says</p>
              <p className="text-sm text-amber-300">{rationale}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot, i) => slot.recipe && (
              <MealSlotCard
                key={slot.recipeId}
                day={slot.day}
                recipe={slot.recipe}
                confirmed={slot.confirmed}
                onConfirm={() => confirmSlot(i)}
                onSwap={() => swapSlot(i)}
                swapping={swappingIdx === i}
              />
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => generatePlan()}>
              Regenerate All
            </Button>
            {allConfirmed && (
              <Button onClick={generateShoppingList} loading={phase === 'shopping-loading'}>
                Generate Shopping List →
              </Button>
            )}
          </div>
        </>
      )}

      {phase === 'shopping' && shoppingList && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((slot) => slot.recipe && (
              <div key={slot.recipeId} className="flex items-center gap-3 bg-surface-2 border border-green-600 rounded-xl px-4 py-3">
                <span className="text-green-400">✓</span>
                <span className="text-sm font-medium text-foreground">{slot.recipe.name}</span>
                <span className="ml-auto text-xs font-mono text-muted">{slot.day}</span>
              </div>
            ))}
          </div>

          <ShoppingListView list={shoppingList} />

          <Button variant="secondary" onClick={() => { setPhase('idle'); setSlots([]); setShoppingList(null); }}>
            Start New Plan
          </Button>
        </>
      )}

      {error && phase === 'idle' && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
