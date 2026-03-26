import Link from 'next/link';
import { Recipe } from '@/types';
import Badge from '@/components/ui/Badge';

const methodIcon: Record<string, string> = {
  air_fryer: '💨',
  stovetop: '🔥',
  oven: '♨️',
  no_cook: '🥗',
  one_pot: '🍲',
};

export default function RecipeCard({ recipe, href }: { recipe: Recipe; href?: string }) {
  const content = (
    <div className="bg-surface-2 border border-border rounded-xl p-4 transition-all hover:border-accent/40 hover:-translate-y-0.5 cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-foreground leading-snug">
          {recipe.favorite && <span className="text-amber-400 mr-1">⭐</span>}
          {recipe.name}
        </h3>
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

      <div className="flex flex-wrap gap-1">
        {recipe.tags.map((t) => (
          <Badge key={t} color="amber">{t.replace('_', '-')}</Badge>
        ))}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
