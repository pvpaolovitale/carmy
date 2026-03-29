'use client';

import Link from 'next/link';
import { Recipe } from '@/types';
import Badge from '@/components/ui/Badge';
import { getProteinTypeLabel } from '@/lib/recipeUtils';

const methodIcon: Record<string, string> = {
  air_fryer: '💨',
  stovetop: '🔥',
  oven: '♨️',
  no_cook: '🥗',
  one_pot: '🍲',
};

interface RecipeBankCardProps {
  recipe: Recipe;
  onToggleFavorite: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  pendingDelete: boolean;
  onConfirmDelete: (recipe: Recipe) => void;
  onCancelDelete: () => void;
}

export default function RecipeBankCard({
  recipe,
  onToggleFavorite,
  onDelete,
  pendingDelete,
  onConfirmDelete,
  onCancelDelete,
}: RecipeBankCardProps) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 transition-all hover:border-accent/40">
      {/* Top row: title + method icons */}
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

      {/* Action row */}
      {pendingDelete ? (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          <span className="text-xs text-muted flex-1">Delete this recipe?</span>
          <button
            onClick={() => onConfirmDelete(recipe)}
            className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/40 hover:border-red-400 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="text-xs text-muted hover:text-foreground px-2 py-1 rounded border border-border transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2 mt-2 pt-2 border-t border-border">
          <button
            onClick={() => onToggleFavorite(recipe)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              recipe.favorite
                ? 'text-amber-400 border-amber-500/40 hover:border-amber-400'
                : 'text-muted border-border hover:text-amber-400 hover:border-amber-500/40'
            }`}
            title={recipe.favorite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {recipe.favorite ? '⭐ Unfavourite' : '☆ Favourite'}
          </button>
          <button
            onClick={() => onDelete(recipe)}
            className="text-xs text-muted hover:text-red-400 px-2 py-1 rounded border border-border hover:border-red-500/40 transition-colors ml-auto"
            title="Delete recipe"
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}
