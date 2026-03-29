import { NextResponse } from 'next/server';
import { getAllRecipes } from '@/lib/recipes';
import { callClaudeJSON } from '@/lib/claude';
import { buildShoppingListPrompt } from '@/lib/prompts';
import { RawShoppingSection, Recipe, SelectedProteinBuffer } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recipeIds, proteinBuffers } = body as {
      recipeIds: string[];
      proteinBuffers?: SelectedProteinBuffer[];
    };

    if (!recipeIds || recipeIds.length < 2 || recipeIds.length > 7) {
      return NextResponse.json({ error: 'Between 2 and 7 recipe IDs required' }, { status: 400 });
    }

    const allRecipes = await getAllRecipes();
    const recipes: Recipe[] = recipeIds
      .map((id) => allRecipes.find((r) => r.id === id))
      .filter(Boolean) as Recipe[];

    if (recipes.length !== recipeIds.length) {
      return NextResponse.json({ error: 'One or more recipe IDs not found' }, { status: 404 });
    }

    const systemPrompt = buildShoppingListPrompt(recipes, proteinBuffers);
    const result = await callClaudeJSON<{ sections: RawShoppingSection[]; wasteNotes?: string[] }>(
      systemPrompt,
      'Generate the shopping list.'
    );

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      sections: result.sections,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate shopping list' }, { status: 500 });
  }
}
