'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Link from 'next/link';
import { Recipe } from '@/types';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { getCurrentWeekMonday } from '@/lib/dates';
import { getProteinTypeLabel } from '@/lib/recipeUtils';

const methodIcon: Record<string, string> = {
  air_fryer: '💨',
  stovetop: '🔥',
  oven: '♨️',
  no_cook: '🥗',
  one_pot: '🍲',
};

export default function CookPage() {
  const weekStartDate = getCurrentWeekMonday();
  const activePlan = useQuery(api.weeklyPlans.getActivePlan, { weekStartDate });
  const allRawRecipes = useQuery(api.recipes.getAll);
  const completions = useQuery(
    api.weeklyPlans.getRecipeCompletions,
    activePlan ? { weeklyPlanId: activePlan._id as Id<'weeklyPlans'> } : 'skip'
  );
  const markDone = useMutation(api.weeklyPlans.markRecipeDone);
  const markBufferDone = useMutation(api.weeklyPlans.markBufferDone);

  const allRecipes = (allRawRecipes as unknown as Recipe[] | undefined) ?? [];

  // Loading state
  if (activePlan === undefined || allRawRecipes === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🍳 Cook</h1>
        </div>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  // No active plan or plan is not in cooking phase
  if (!activePlan || (activePlan.status !== 'cooking' && activePlan.status !== 'done')) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🍳 Cook</h1>
          <p className="text-muted text-sm mt-1">This week&apos;s planned recipes.</p>
        </div>
        <div className="bg-surface-2 border border-border rounded-xl p-8 text-center">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-foreground font-semibold mb-2">No active cooking plan this week</p>
          <p className="text-muted text-sm mb-6">
            Generate a weekly plan and finish shopping first, then come back here to cook.
          </p>
          <Link
            href="/weekly-plan"
            className="inline-block bg-accent text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors"
          >
            Go to Weekly Plan →
          </Link>
        </div>
      </div>
    );
  }

  // Derive this week's recipes from the active plan
  const thisWeekRecipes = activePlan.dinnerSlots
    .map((slot) => ({
      slot,
      recipe: allRecipes.find((r) => r.id === slot.recipeId),
    }))
    .filter((entry): entry is { slot: typeof activePlan.dinnerSlots[0]; recipe: Recipe } => !!entry.recipe);

  const completedIds = new Set((completions ?? []).map((c) => c.recipeId));

  const handleMarkDone = async (recipeId: string) => {
    if (!activePlan) return;
    await markDone({
      weeklyPlanId: activePlan._id as Id<'weeklyPlans'>,
      recipeId,
    });
  };

  const handleMarkBufferDone = async (bufferName: string) => {
    if (!activePlan) return;
    await markBufferDone({
      weeklyPlanId: activePlan._id as Id<'weeklyPlans'>,
      bufferName,
    });
  };

  const doneCount = thisWeekRecipes.filter((e) => completedIds.has(e.recipe.id)).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🍳 Cook</h1>
        <p className="text-muted text-sm mt-1">
          This week&apos;s plan · {doneCount}/{thisWeekRecipes.length} done
        </p>
      </div>

      {/* ── Protein Buffers section ── */}
      {activePlan.selectedProteinBuffers && activePlan.selectedProteinBuffers.length > 0 && (
        <div className="bg-surface-2 border border-amber-500/30 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">🌅 Protein Buffers</h2>
          <div className="flex flex-col gap-3">
            {activePlan.selectedProteinBuffers.map((buffer) => {
              const isDone = completedIds.has(`buffer::${buffer.name}`);
              return (
                <div
                  key={buffer.name}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isDone ? 'border-green-600/50 opacity-70' : 'border-amber-500/20 bg-amber-500/5'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{buffer.name}</p>
                      {isDone && <span className="text-xs font-semibold text-green-400">✓ Done</span>}
                    </div>
                    <p className="text-xs text-muted mb-1">{buffer.description}</p>
                    <div className="flex gap-3 text-xs font-mono text-muted">
                      <span>💪 {buffer.proteinG}g protein</span>
                      <span>🔥 {buffer.kcal} kcal</span>
                      <span>×{buffer.servings} servings</span>
                    </div>
                  </div>
                  {!isDone && (
                    <button
                      onClick={() => handleMarkBufferDone(buffer.name)}
                      className="text-xs font-semibold text-green-400 border border-green-600/40 px-3 py-2 rounded-lg hover:border-green-400 transition-colors flex-shrink-0"
                    >
                      Mark Done ✓
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {thisWeekRecipes.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-4">📭</p>
          <p>No recipes found for this week.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {thisWeekRecipes.map(({ slot, recipe }) => {
            const isDone = completedIds.has(recipe.id);
            return (
              <div
                key={`${slot.day}-${recipe.id}`}
                className={`bg-surface-2 border rounded-xl p-4 transition-all ${
                  isDone ? 'border-green-600/50 opacity-70' : 'border-border hover:border-accent/40'
                }`}
              >
                {/* Day label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted uppercase tracking-widest capitalize">{slot.day}</span>
                  {isDone && <span className="text-xs font-semibold text-green-400">✓ Done</span>}
                </div>

                {/* Recipe header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/cook/${recipe.slug}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground leading-snug hover:text-accent transition-colors">
                      {recipe.favorite && <span className="text-amber-400 mr-1">⭐</span>}
                      {recipe.name}
                    </h3>
                  </Link>
                  <div className="flex gap-1 flex-shrink-0">
                    {recipe.cookingMethods.map((m) => (
                      <span key={m} title={m} className="text-base">{methodIcon[m] ?? '🍽️'}</span>
                    ))}
                  </div>
                </div>

                <p className="text-muted text-xs mb-3 line-clamp-2">{recipe.description}</p>

                <div className="flex gap-3 text-xs font-mono text-muted mb-3">
                  <span>⏱ {recipe.prepTimeMin + recipe.cookTimeMin}min</span>
                  <span>🔥 {recipe.macrosPerServing.kcal} kcal</span>
                  <span>💪 {recipe.macrosPerServing.proteinG}g</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(() => { const { label, emoji } = getProteinTypeLabel(recipe); return <Badge color="amber">{emoji} {label}</Badge>; })()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/cook/${recipe.slug}`}
                    className="flex-1 text-center text-xs font-semibold text-foreground border border-border px-3 py-2 rounded-lg hover:border-accent/60 transition-colors"
                  >
                    View Recipe →
                  </Link>
                  {!isDone && (
                    <button
                      onClick={() => handleMarkDone(recipe.id)}
                      className="text-xs font-semibold text-green-400 border border-green-600/40 px-3 py-2 rounded-lg hover:border-green-400 transition-colors"
                    >
                      Mark Done ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
