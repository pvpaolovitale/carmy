import { getAllRecipes } from '@/lib/recipes';
import RecipeCard from '@/components/cook/RecipeCard';
import Link from 'next/link';

export default async function RecipeBankPage() {
  const recipes = await getAllRecipes();
  const favorites = recipes.filter((r) => r.favorite);
  const rest = recipes.filter((r) => !r.favorite);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📖 Recipe Bank</h1>
          <p className="text-muted text-sm mt-1">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/recipe-bank/add"
          className="bg-accent text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors"
        >
          + Add Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-muted mb-4">Your recipe bank is empty.</p>
          <Link href="/recipe-bank/add" className="text-accent hover:underline text-sm">
            Add your first recipe →
          </Link>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">⭐ Favorites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((r) => (
                  <RecipeCard key={r.id} recipe={r} href={`/cook/${r.slug}`} />
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              {favorites.length > 0 && (
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">All Recipes</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rest.map((r) => (
                  <RecipeCard key={r.id} recipe={r} href={`/cook/${r.slug}`} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
