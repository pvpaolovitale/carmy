import { notFound } from 'next/navigation';
import { getRecipeBySlug } from '@/lib/recipes';
import AirFryerBadge from '@/components/cook/AirFryerBadge';
import StepList from '@/components/cook/StepList';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

export default async function CookRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) notFound();

  const totalTime = recipe.prepTimeMin + recipe.cookTimeMin;

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
            {recipe.favorite && <span className="text-amber-400 mr-2">⭐</span>}
            {recipe.name}
          </h1>
        </div>
        {recipe.nameEs && <p className="text-muted text-sm mt-0.5">{recipe.nameEs}</p>}
        <p className="text-muted mt-2 text-sm">{recipe.description}</p>

        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs font-mono text-muted">⏱ {totalTime}min total</span>
          <span className="text-xs font-mono text-muted">· prep {recipe.prepTimeMin}min</span>
          <span className="text-xs font-mono text-muted">· cook {recipe.cookTimeMin}min</span>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'kcal', value: recipe.macrosPerServing.kcal * 2, note: 'double' },
          { label: 'protein', value: `${recipe.macrosPerServing.proteinG * 2}g` },
          { label: 'carbs', value: `${recipe.macrosPerServing.carbsG * 2}g` },
          { label: 'fat', value: `${recipe.macrosPerServing.fatG * 2}g` },
        ].map((m) => (
          <div key={m.label} className="bg-surface-2 border border-border rounded-lg p-3 text-center">
            <p className="text-lg font-bold font-mono text-accent">{m.value}</p>
            <p className="text-xs text-muted">{m.label}</p>
            {m.note && <p className="text-xs text-muted/60">{m.note}</p>}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted -mt-2">Per double portion (Cook Once, Eat Twice)</p>

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

      {/* Protein Buffer */}
      {recipe.proteinBuffer && (
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-1">🌅 Protein Buffer Pairing</h2>
          <p className="text-sm text-muted">{recipe.proteinBuffer.name}</p>
          <p className="text-xs text-muted/60 mt-1">{recipe.proteinBuffer.description} · {recipe.proteinBuffer.proteinG}g protein</p>
        </div>
      )}

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
