'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { notFound, useParams } from 'next/navigation';
import AirFryerBadge from '@/components/cook/AirFryerBadge';
import StepList from '@/components/cook/StepList';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Recipe } from '@/types';

export default function CookRecipePage() {
  const params = useParams();
  const slug = params.slug as string;

  const rawRecipe = useQuery(api.recipes.getBySlug, { slug });
  const updateRecipe = useMutation(api.recipes.update);

  if (rawRecipe === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <Link href="/cook" className="text-muted text-sm hover:text-foreground transition-colors">
          ← Back to recipes
        </Link>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (rawRecipe === null) {
    notFound();
  }

  const recipe = rawRecipe as unknown as Recipe;
  const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;

  const handleToggleFavorite = async () => {
    await updateRecipe({ slug: recipe.slug, patch: { favorite: !recipe.favorite } });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link href="/cook" className="text-muted text-sm hover:text-foreground transition-colors">
        ← Back to recipes
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {recipe.name}
          </h1>
          <button
            onClick={handleToggleFavorite}
            className={`flex-shrink-0 text-xl transition-transform hover:scale-110 ${recipe.favorite ? 'text-amber-400' : 'text-muted hover:text-amber-400'}`}
            title={recipe.favorite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {recipe.favorite ? '⭐' : '☆'}
          </button>
        </div>
        {recipe.nameEs && <p className="text-muted text-sm mt-0.5">{recipe.nameEs}</p>}
        <p className="text-muted mt-2 text-sm">{recipe.description}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs font-mono text-muted">⏱ {totalTime}min total</span>
          <span className="text-xs font-mono text-muted">· prep {recipe.prepTimeMin}min</span>
          <span className="text-xs font-mono text-muted">· cook {recipe.cookTimeMin}min</span>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {recipe.tags.map((t) => (
            <Badge key={t} color="amber">{t.replace('_', '-')}</Badge>
          ))}
        </div>
      </div>

      {/* Macros — Per Serving */}
      <div>
        <p className="text-xs text-muted mb-2 font-semibold uppercase tracking-wider">Per serving</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'kcal', value: recipe.macrosPerServing.kcal },
            { label: 'protein', value: `${recipe.macrosPerServing.proteinG}g` },
            { label: 'carbs', value: `${recipe.macrosPerServing.carbsG}g` },
            { label: 'fat', value: `${recipe.macrosPerServing.fatG}g` },
          ].map((m) => (
            <div key={m.label} className="bg-surface-2 border border-border rounded-lg p-3 text-center">
              <p className="text-lg font-bold font-mono text-foreground">{m.value}</p>
              <p className="text-xs text-muted">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Macros — Double Portion */}
      <div>
        <p className="text-xs text-muted mb-2 font-semibold uppercase tracking-wider">Double portion <span className="normal-case font-normal">(Cook Once, Eat Twice)</span></p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'kcal', value: recipe.macrosPerServing.kcal * 2 },
            { label: 'protein', value: `${recipe.macrosPerServing.proteinG * 2}g` },
            { label: 'carbs', value: `${recipe.macrosPerServing.carbsG * 2}g` },
            { label: 'fat', value: `${recipe.macrosPerServing.fatG * 2}g` },
          ].map((m) => (
            <div key={m.label} className="bg-surface-2 border border-accent/30 rounded-lg p-3 text-center">
              <p className="text-lg font-bold font-mono text-accent">{m.value}</p>
              <p className="text-xs text-muted">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Air Fryer */}
      {recipe.airFryerSettings && <AirFryerBadge settings={recipe.airFryerSettings} />}

      {/* Ingredients */}
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Ingredients — double portion</h2>
        <ul className="flex flex-col gap-2">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {ing.name}
                {ing.nameEs && <span className="text-muted/60"> / {ing.nameEs}</span>}
                {ing.optional && <span className="text-muted text-xs ml-1">(optional)</span>}
              </span>
              <span className="font-mono text-muted text-xs">{ing.quantity * 2}{ing.unit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Steps</h2>
        <StepList steps={recipe.steps} />
      </div>

      {/* Storage */}
      <div className="bg-green-500/10 border border-green-600/30 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-green-400 mb-2">🍱 Cook Once, Eat Twice</h2>
        <div className="text-sm text-muted flex flex-col gap-1">
          <p>❄️ Fridge: {recipe.storageNotes.fridgeDays} days</p>
          {recipe.storageNotes.freezerDays && <p>🧊 Freezer: {recipe.storageNotes.freezerDays} days</p>}
          <p>♨️ Reheat: {recipe.storageNotes.reheatingMethod}</p>
          {recipe.storageNotes.portionNotes && (
            <p className="text-muted/80 text-xs mt-1">💡 {recipe.storageNotes.portionNotes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
