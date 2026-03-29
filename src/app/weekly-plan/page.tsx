'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  Recipe,
  DinnerSlot,
  DayOfWeek,
  GeneratePlanResponse,
  RawShoppingSection,
  SelectedProteinBuffer,
  MealSlot,
  BufferSlot,
  MealType,
} from '@/types';
import WeeklyTimetable from '@/components/weekly-plan/WeeklyTimetable';
import ShoppingListView from '@/components/weekly-plan/ShoppingListView';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { getCurrentWeekMonday } from '@/lib/dates';
import { HONEST_GREENS } from '@/lib/glovoConstants';

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMETABLE_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export default function WeeklyPlanPage() {
  const router = useRouter();
  const weekStartDate = getCurrentWeekMonday();

  // ── Convex queries & mutations ───────────────────────────────────────────────
  const activePlan = useQuery(api.weeklyPlans.getActivePlan, { weekStartDate });
  const allRawRecipes = useQuery(api.recipes.getAll);
  const standaloneBuffers = useQuery(api.proteinBuffers.getAll);

  const createPlan = useMutation(api.weeklyPlans.createPlan);
  const updateDinnerSlots = useMutation(api.weeklyPlans.updateDinnerSlots);
  const updateSelectedBuffers = useMutation(api.weeklyPlans.updateSelectedBuffers);
  const updateMealSlotsConvex = useMutation(api.weeklyPlans.updateMealSlots);
  const updateBufferSlotsConvex = useMutation(api.weeklyPlans.updateBufferSlots);
  const deleteShoppingItems = useMutation(api.weeklyPlans.deleteShoppingItemsForPlan);
  const bulkInsertShoppingItems = useMutation(api.weeklyPlans.bulkInsertShoppingItems);
  const confirmPlan = useMutation(api.weeklyPlans.confirmPlan);
  const updatePlanStatus = useMutation(api.weeklyPlans.updatePlanStatus);
  const finishWeek = useMutation(api.weeklyPlans.finishWeek);
  const deletePlan = useMutation(api.weeklyPlans.deletePlan);

  // ── Local UI state ───────────────────────────────────────────────────────────
  const [recipeCount, setRecipeCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [error, setError] = useState('');
  const [selectedBuffers, setSelectedBuffers] = useState<SelectedProteinBuffer[]>([]);
  const [timetableConfirmed, setTimetableConfirmed] = useState(false);

  const allRecipes = (allRawRecipes as unknown as Recipe[] | undefined) ?? [];

  // ── Derive meal slots by joining plan + recipes ──────────────────────────────
  const slots: DinnerSlot[] = (activePlan?.dinnerSlots ?? []).map((s) => ({
    day: s.day as DayOfWeek,
    recipeId: s.recipeId,
    confirmed: s.confirmed,
    recipe: allRecipes.find((r) => r.id === s.recipeId),
  }));

  // Always show Mon–Fri when a plan exists
  const planDays = activePlan ? TIMETABLE_DAYS : [];

  // Unique recipes from plan slots (deduped) — Honest Greens lives only in the Glovo pool
  const planRecipes = slots
    .map((s) => s.recipe)
    .filter((r): r is Recipe => !!r)
    .filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);

  const derivedMealSlots: MealSlot[] =
    (activePlan as { mealSlots?: MealSlot[] } | null)?.mealSlots ??
    (activePlan?.dinnerSlots ?? []).map((slot) => ({
      day: slot.day,
      mealType: 'dinner' as MealType,
      recipeId: slot.recipeId,
    }));
  const derivedBufferSlots: BufferSlot[] =
    (activePlan as { bufferSlots?: BufferSlot[] } | null)?.bufferSlots ?? [];

  // ── Deduplicated protein buffers (recipe-embedded + standalone) ──────────────
  const availableBuffers: SelectedProteinBuffer[] = (() => {
    const seen = new Set<string>();
    const result: SelectedProteinBuffer[] = [];
    // Recipe-embedded buffers
    for (const r of allRecipes) {
      if (r.proteinBuffer && !seen.has(r.proteinBuffer.name)) {
        seen.add(r.proteinBuffer.name);
        result.push({ ...r.proteinBuffer, servings: 1 });
      }
    }
    // Standalone buffers from the proteinBuffers table
    for (const b of standaloneBuffers ?? []) {
      if (!seen.has(b.name)) {
        seen.add(b.name);
        result.push({ name: b.name, kcal: b.kcal, proteinG: b.proteinG, description: b.description, servings: 1 });
      }
    }
    return result;
  })();

  // ── Reset local state when plan changes phase ────────────────────────────────
  useEffect(() => {
    if (activePlan?.status === 'planning') {
      setSelectedBuffers([]);
      setTimetableConfirmed(false);
    }
    if (activePlan?.selectedProteinBuffers) {
      setSelectedBuffers(activePlan.selectedProteinBuffers.map((b) => ({ ...b })));
    }
  }, [activePlan?.status, activePlan?.selectedProteinBuffers]);

  // ── Generate plan ────────────────────────────────────────────────────────────
  const generatePlan = async (excludeIds: string[] = []) => {
    setError('');
    setIsGenerating(true);
    try {
      const planRes = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeRecipeIds: excludeIds, recipeCount }),
      });

      if (!planRes.ok) {
        const err = await planRes.json();
        throw new Error(err.error || 'Failed to generate plan');
      }

      const plan: GeneratePlanResponse = await planRes.json();

      const newSlots = plan.selectedRecipeIds.map((id, i) => ({
        day: DAYS[i],
        recipeId: id,
        confirmed: false,
      }));

      if (activePlan) {
        await updateDinnerSlots({ id: activePlan._id as Id<'weeklyPlans'>, dinnerSlots: newSlots });
      } else {
        await createPlan({
          weekStartDate,
          recipeCount,
          dinnerSlots: newSlots,
          rationale: plan.rationale,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Pool management ──────────────────────────────────────────────────────────

  const handlePoolRecipeRemove = async (recipeId: string) => {
    if (!activePlan) return;
    const updatedMealSlots = derivedMealSlots.filter((s) => s.recipeId !== recipeId);
    const updatedDinnerSlots = (activePlan.dinnerSlots ?? []).filter((s) => s.recipeId !== recipeId);
    await updateMealSlotsConvex({
      id: activePlan._id as Id<'weeklyPlans'>,
      mealSlots: updatedMealSlots,
      dinnerSlots: updatedDinnerSlots,
    });
  };

  const handlePoolRecipeAdd = async (recipeId: string) => {
    if (!activePlan) return;
    const usedDays = new Set((activePlan.dinnerSlots ?? []).map((s) => s.day));
    // Use a weekend slot (not shown in timetable) as placeholder day for pool-only recipes
    const poolDay =
      (['saturday', 'sunday'] as DayOfWeek[]).find((d) => !usedDays.has(d)) ??
      DAYS.find((d) => !usedDays.has(d)) ??
      ('saturday' as DayOfWeek);
    const updatedDinnerSlots = [
      ...(activePlan.dinnerSlots ?? []),
      { day: poolDay, recipeId, confirmed: false },
    ];
    await updateDinnerSlots({
      id: activePlan._id as Id<'weeklyPlans'>,
      dinnerSlots: updatedDinnerSlots,
    });
  };

  // ── Timetable handlers ───────────────────────────────────────────────────────
  const handleMealSlotsUpdate = async (
    mealSlots: MealSlot[],
    dinnerSlots: Array<{ day: string; recipeId: string; confirmed: boolean }>
  ) => {
    if (!activePlan) return;

    // Never write Glovo placeholder IDs into dinnerSlots (they don't need shopping)
    const realDinnerSlots = dinnerSlots.filter((s) => !s.recipeId.startsWith('glovo::'));

    const clearedDays = new Set(
      mealSlots.filter((s) => s.mealType === 'dinner' && !s.recipeId).map((s) => s.day)
    );
    const updatedDays = new Set(realDinnerSlots.map((s) => s.day));
    const updatedRecipeIds = new Set(realDinnerSlots.map((s) => s.recipeId));

    // Merge: keep existing slots not touched, clean up pool-placeholder entries for recipes
    // that now have a proper timetable day (avoid duplicates in shopping list)
    const mergedDinnerSlots = [
      ...(activePlan.dinnerSlots ?? []).filter(
        (s) =>
          !updatedDays.has(s.day) &&
          !clearedDays.has(s.day) &&
          !updatedRecipeIds.has(s.recipeId)
      ),
      ...realDinnerSlots,
    ];

    await updateMealSlotsConvex({
      id: activePlan._id as Id<'weeklyPlans'>,
      mealSlots,
      dinnerSlots: mergedDinnerSlots,
    });
  };

  const handleBufferSlotsUpdate = async (bufferSlots: BufferSlot[]) => {
    if (!activePlan) return;
    await updateBufferSlotsConvex({ id: activePlan._id as Id<'weeklyPlans'>, bufferSlots });
  };

  const handleTimetableConfirm = (derivedBuffers: SelectedProteinBuffer[]) => {
    setSelectedBuffers(derivedBuffers);
    setTimetableConfirmed(true);
  };

  // ── Generate shopping list ────────────────────────────────────────────────────
  const generateShoppingList = async () => {
    if (!activePlan) return;
    setIsGeneratingList(true);
    setError('');
    try {
      // Deduplicate recipeIds to avoid counting pool-placeholder slots twice
      const recipeIds = [...new Set(slots.map((s) => s.recipeId))];
      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds, proteinBuffers: selectedBuffers }),
      });

      if (!res.ok) throw new Error('Failed to generate shopping list');
      const data: { generatedAt: string; sections: RawShoppingSection[] } = await res.json();

      if (selectedBuffers.length > 0) {
        await updateSelectedBuffers({
          id: activePlan._id as Id<'weeklyPlans'>,
          selectedProteinBuffers: selectedBuffers,
        });
      }

      await deleteShoppingItems({ weeklyPlanId: activePlan._id as Id<'weeklyPlans'> });

      const flatItems = data.sections.flatMap((section) =>
        section.items.map((item) => ({
          section: section.section,
          nameEn: item.nameEn,
          nameEs: item.nameEs,
          quantity: item.quantity,
          recipes: item.recipes,
        }))
      );

      await bulkInsertShoppingItems({
        weeklyPlanId: activePlan._id as Id<'weeklyPlans'>,
        items: flatItems,
      });

      await confirmPlan({ id: activePlan._id as Id<'weeklyPlans'> });
    } catch {
      setError('Could not generate shopping list. Try again.');
    } finally {
      setIsGeneratingList(false);
    }
  };

  // ── Done shopping → cooking mode ─────────────────────────────────────────────
  const handleDoneShopping = async () => {
    if (!activePlan) return;
    await updatePlanStatus({ id: activePlan._id as Id<'weeklyPlans'>, status: 'cooking' });
    router.push('/cook');
  };

  // ── Finish / reset week ───────────────────────────────────────────────────────
  const handleFinishWeek = async () => {
    if (!activePlan) return;
    await finishWeek({ id: activePlan._id as Id<'weeklyPlans'> });
  };

  const handleStartNewWeek = async () => {
    if (!activePlan) return;
    await deletePlan({ id: activePlan._id as Id<'weeklyPlans'> });
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (activePlan === undefined || allRawRecipes === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📅 Weekly Plan</h1>
        </div>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const planStatus = activePlan?.status;

  // ── Shared timetable component (rendered in all active phases) ────────────────
  const timetable = activePlan ? (
    <WeeklyTimetable
      key={activePlan._id}
      days={planDays}
      mealSlots={derivedMealSlots}
      bufferSlots={derivedBufferSlots}
      availableRecipes={planRecipes}
      availableBuffers={availableBuffers}
      allRecipes={allRecipes}
      onMealSlotsUpdate={handleMealSlotsUpdate}
      onBufferSlotsUpdate={handleBufferSlotsUpdate}
      onConfirm={handleTimetableConfirm}
      onPoolRecipeRemove={handlePoolRecipeRemove}
      onPoolRecipeAdd={handlePoolRecipeAdd}
    />
  ) : null;

  // ── Shared recipe count controls ──────────────────────────────────────────────
  const showControls = !activePlan || planStatus === 'planning';
  const controlsLabel = activePlan ? 'Regenerate:' : 'Dinners this week:';
  const controlsButtonLabel = activePlan ? 'Regenerate All' : 'Generate Plan';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">📅 Weekly Plan</h1>
        <p className="text-muted text-sm mt-1">
          Week of {weekStartDate} · Cook Once, Eat Twice
        </p>
      </div>

      {/* ── IDLE: welcome message ── */}
      {!activePlan && (
        <div className="bg-surface-2 border border-border rounded-xl p-8 text-center">
          <p className="text-4xl mb-4">🧑‍🍳</p>
          <p className="text-foreground font-semibold mb-2">Ready to plan your week?</p>
          <p className="text-muted text-sm">
            Carmy will pick dinners from your recipe bank.
          </p>
        </div>
      )}

      {/* ── PLANNING phase: Carmy says ── */}
      {activePlan && planStatus === 'planning' && activePlan.rationale && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-xs text-amber-400 font-semibold mb-1">👨‍🍳 Carmy says</p>
          <p className="text-sm text-amber-300">{activePlan.rationale}</p>
        </div>
      )}

      {/* ── Recipe count controls (IDLE + PLANNING) ── */}
      {showControls && (
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted">{controlsLabel}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRecipeCount((n) => Math.max(2, n - 1))}
                className="w-8 h-8 rounded-full border border-border text-foreground hover:border-accent/60 transition-colors font-bold"
              >
                −
              </button>
              <span className="text-xl font-bold font-mono text-accent w-6 text-center">{recipeCount}</span>
              <button
                onClick={() => setRecipeCount((n) => Math.min(7, n + 1))}
                className="w-8 h-8 rounded-full border border-border text-foreground hover:border-accent/60 transition-colors font-bold"
              >
                +
              </button>
            </div>
            <Button
              onClick={() => {
                setTimetableConfirmed(false);
                generatePlan();
              }}
              loading={isGenerating}
              size="sm"
            >
              {controlsButtonLabel}
            </Button>
          </div>
          {error && !timetableConfirmed && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* ── Timetable (all active phases) ── */}
      {timetable}

      {/* ── PLANNING: confirm + shopping list generation ── */}
      {activePlan && planStatus === 'planning' && timetableConfirmed && (
        <div className="bg-surface-2 border border-border rounded-xl p-4 flex flex-col gap-3">
          {selectedBuffers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted mb-1">🌅 Protein buffers selected</p>
              <div className="flex flex-wrap gap-2">
                {selectedBuffers.map((b) => (
                  <span key={b.name} className="text-xs bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-1 text-amber-300">
                    {b.name} × {b.servings}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Button onClick={generateShoppingList} loading={isGeneratingList}>
            Generate Shopping List →
          </Button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {/* ── SHOPPING: shopping list below timetable ── */}
      {activePlan && planStatus === 'shopping' && (
        <>
          {activePlan.selectedProteinBuffers && activePlan.selectedProteinBuffers.length > 0 && (
            <div className="bg-surface-2 border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-muted mb-2">🌅 Protein Buffers this week</p>
              <div className="flex flex-wrap gap-2">
                {activePlan.selectedProteinBuffers.map((b) => (
                  <span key={b.name} className="text-xs bg-surface-3 border border-border rounded-full px-2 py-1 text-muted">
                    {b.name} × {b.servings}
                  </span>
                ))}
              </div>
            </div>
          )}
          <ShoppingListView weeklyPlanId={activePlan._id as string} />
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleDoneShopping} size="lg">
              🛒 Done Shopping — Let&apos;s Cook!
            </Button>
            <Button variant="secondary" onClick={handleStartNewWeek} size="sm">
              Start New Week
            </Button>
          </div>
        </>
      )}

      {/* ── COOKING: cook banner below timetable ── */}
      {activePlan && planStatus === 'cooking' && (
        <div className="bg-green-500/10 border border-green-600/30 rounded-xl p-6 text-center">
          <p className="text-foreground font-semibold mb-2">🍳 You&apos;re cooking this week!</p>
          <p className="text-muted text-sm mb-4">Head to the Cook section to track progress.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => router.push('/cook')} size="lg">
              Go to Cook →
            </Button>
            <Button variant="secondary" onClick={handleFinishWeek}>
              Finish Week
            </Button>
          </div>
        </div>
      )}

      {/* ── DONE: week completed ── */}
      {activePlan && planStatus === 'done' && (
        <div className="bg-surface-2 border border-border rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-foreground font-semibold mb-2">Great week, chef!</p>
          <p className="text-muted text-sm mb-4">Come back next week to plan your meals.</p>
          <Button onClick={handleStartNewWeek} size="lg">
            Plan New Week →
          </Button>
        </div>
      )}
    </div>
  );
}
