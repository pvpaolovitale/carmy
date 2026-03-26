import Link from 'next/link';
import { getAllRecipes } from '@/lib/recipes';

const DAILY_KCAL = 1750;
const DAILY_PROTEIN = 160;

export default async function Home() {
  const recipes = await getAllRecipes();
  const favorites = recipes.filter((r) => r.favorite);

  const quickStats = [
    { label: 'Daily Calories', value: `${DAILY_KCAL.toLocaleString()} kcal`, icon: '🔥' },
    { label: 'Daily Protein', value: `${DAILY_PROTEIN}g`, icon: '💪' },
    { label: 'Recipes in Bank', value: recipes.length.toString(), icon: '📖' },
    { label: 'Favorites', value: favorites.length.toString(), icon: '⭐' },
  ];

  const actions = [
    { href: '/weekly-plan', icon: '📅', label: 'Plan This Week', desc: 'Get 4 dinner suggestions + shopping list' },
    { href: '/cook', icon: '🍳', label: 'Cook a Recipe', desc: 'Step-by-step with air fryer settings' },
    { href: '/recipe-bank', icon: '📖', label: 'Recipe Bank', desc: 'Browse and add new recipes' },
    { href: '/recipe-bank/add', icon: '✚', label: 'Add Recipe', desc: 'Describe it — Carmy formats it' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          <span className="text-accent">🔪</span> Carmy
        </h1>
        <p className="text-muted mt-1">Your AI Chef & Nutritionist. Pescatarian · Lactose-Free · Cook Once, Eat Twice.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickStats.map((s) => (
          <div key={s.label} className="bg-surface-2 border border-border rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-lg font-bold font-mono text-accent">{s.value}</div>
            <div className="text-xs text-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profile summary */}
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Profile</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted">Goal</span>
          <span className="text-foreground">Fat loss + muscle retention</span>
          <span className="text-muted">Meal timing</span>
          <span className="text-foreground">Intermittent fasting — no breakfast</span>
          <span className="text-muted">Meals</span>
          <span className="text-foreground">Protein buffer (optional) + Lunch + Dinner</span>
          <span className="text-muted">Rule</span>
          <span className="text-foreground font-medium text-amber-400">Cook Once, Eat Twice — every dinner = 2× portions</span>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">What do you want to do?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-start gap-4 bg-surface-2 border border-border rounded-xl p-4 hover:border-accent/40 hover:-translate-y-0.5 transition-all"
            >
              <span className="text-2xl mt-0.5">{a.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{a.label}</p>
                <p className="text-xs text-muted mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">⭐ Favorites</h2>
          <div className="flex flex-col gap-2">
            {favorites.map((r) => (
              <Link
                key={r.id}
                href={`/cook/${r.slug}`}
                className="flex items-center gap-3 bg-surface-2 border border-border rounded-xl px-4 py-3 hover:border-accent/40 transition-colors"
              >
                <span className="text-sm font-medium text-foreground flex-1">{r.name}</span>
                <span className="text-xs font-mono text-muted">{r.macrosPerServing.kcal} kcal · {r.macrosPerServing.proteinG}g</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
