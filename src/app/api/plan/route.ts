import { NextResponse } from 'next/server';
import { getAllRecipes } from '@/lib/recipes';
import { callClaudeJSON } from '@/lib/claude';
import { buildPlanPrompt } from '@/lib/prompts';
import { GeneratePlanRequest, GeneratePlanResponse } from '@/types';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GeneratePlanRequest;
    const recipeCount = Math.min(7, Math.max(2, body.recipeCount ?? 4));
    const recipes = await getAllRecipes();

    if (recipes.length < recipeCount) {
      return NextResponse.json(
        { error: `Need at least ${recipeCount} recipes in the bank to generate a plan` },
        { status: 400 }
      );
    }

    const systemPrompt = buildPlanPrompt(recipes, body.excludeRecipeIds, body.notes, recipeCount);
    const result = await callClaudeJSON<GeneratePlanResponse>(systemPrompt, 'Generate my weekly meal plan.');

    // Validate selected IDs exist and count matches
    const recipeIds = new Set(recipes.map((r) => r.id));
    const valid = result.selectedRecipeIds.every((id) => recipeIds.has(id));
    if (!valid || result.selectedRecipeIds.length !== recipeCount) {
      return NextResponse.json({ error: 'Claude returned invalid recipe IDs' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}
