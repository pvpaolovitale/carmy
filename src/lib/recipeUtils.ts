import { Recipe } from '@/types';

export function getProteinTypeLabel(recipe: Recipe): { label: string; emoji: string } {
  const hasFish = recipe.ingredients.some((i) => i.supermarketSection === 'fish_seafood');
  if (hasFish) return { label: 'Fish', emoji: '🐟' };
  if (recipe.tags.includes('vegan')) return { label: 'Vegan', emoji: '🌱' };
  return { label: 'Veggie', emoji: '🥗' };
}
