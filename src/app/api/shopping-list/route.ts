import { NextResponse } from 'next/server';
import { getRecipeBySlug, getAllRecipes } from '@/lib/recipes';
import { callClaudeJSON } from '@/lib/claude';
import { buildShoppingListPrompt } from '@/lib/prompts';
import { ShoppingList, Recipe } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipeIds } = body as { recipeIds: string[] };

    if (!recipeIds || recipeIds.length !== 4) {
      return NextResponse.json({ error: 'Exactly 4 recipe IDs required' }, { status: 400 });
    }

    const allRecipes = await getAllRecipes();
    const recipes: Recipe[] = recipeIds
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter(Boolean) as Recipe[];

    if (recipes.length !== 4) {
      return NextResponse.json({ error: 'One or more recipe IDs not found' }, { status: 404 });
    }

    const systemPrompt = buildShoppingListPrompt(recipes);
    const result = await callClaudeJSON<{ sections: ShoppingList['sections']; wasteNotes?: string[] }>(
      systemPrompt,
      'Generate the shopping list.'
    );

    const shoppingList: ShoppingList = {
      generatedAt: new Date().toISOString(),
      sections: result.sections,
    };

    return NextResponse.json(shoppingList);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate shopping list' }, { status: 500 });
  }
}
