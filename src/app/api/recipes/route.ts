import { NextResponse } from 'next/server';
import { getAllRecipes, addRecipe } from '@/lib/recipes';
import { Recipe } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { buildSlug } from '@/lib/prompts';

export async function GET() {
  try {
    const recipes = await getAllRecipes();
    return NextResponse.json(recipes);
  } catch {
    return NextResponse.json({ error: 'Failed to load recipes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const partial = body as Omit<Recipe, 'id' | 'slug' | 'createdAt' | 'source'>;

    const recipe: Recipe = {
      ...partial,
      id: uuidv4(),
      slug: buildSlug(partial.name),
      createdAt: new Date().toISOString(),
      source: 'ai_formatted',
    };

    await addRecipe(recipe);
    return NextResponse.json(recipe, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add recipe' }, { status: 500 });
  }
}
