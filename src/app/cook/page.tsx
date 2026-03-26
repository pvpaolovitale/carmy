import { getAllRecipes } from '@/lib/recipes';
import RecipeCard from '@/components/cook/RecipeCard';

export default async function CookPage() {
  const recipes = await getAllRecipes();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🍳 Cook</h1>
        <p className="text-muted text-sm mt-1">Pick a recipe — get step-by-step instructions with air fryer settings.</p>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-4">📭</p>
          <p>No recipes yet. Add one to your bank first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} href={`/cook/${recipe.slug}`} />
          ))}
        </div>
      )}
    </div>
  );
}
