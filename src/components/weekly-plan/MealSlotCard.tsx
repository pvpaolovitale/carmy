'use client';

import { Recipe, DayOfWeek } from '@/types';
import Button from '@/components/ui/Button';

interface MealSlotCardProps {
  day: DayOfWeek;
  recipe: Recipe;
  confirmed: boolean;
  onConfirm: () => void;
  onSwap: () => void;
  swapping?: boolean;
}

const dayLabel: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function MealSlotCard({ day, recipe, confirmed, onConfirm, onSwap, swapping }: MealSlotCardProps) {
  return (
    <div
      className={`border rounded-xl p-4 transition-all ${
        confirmed ? 'border-green-600 bg-green-500/5' : 'border-border bg-surface-2'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted uppercase tracking-widest">{dayLabel[day]}</span>
        {confirmed && <span className="text-green-400 text-xs font-semibold">✓ Confirmed</span>}
      </div>

      <h3 className="font-semibold text-foreground mb-1">
        {recipe.favorite && <span className="text-amber-400 mr-1">⭐</span>}
        {recipe.name}
      </h3>
      <p className="text-muted text-xs mb-3 line-clamp-2">{recipe.description}</p>

      <div className="flex gap-3 text-xs font-mono text-muted mb-4">
        <span>🔥 {recipe.macrosPerServing.kcal * 2} kcal</span>
        <span>💪 {recipe.macrosPerServing.proteinG * 2}g protein</span>
        <span className="text-muted/60">(×2 portions)</span>
      </div>

      {!confirmed && (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSwap} loading={swapping}>
            Swap
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      )}
    </div>
  );
}
