import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { Recipe } from '@/types';

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  return new ConvexHttpClient(url);
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const client = getClient();
  const docs = await client.query(api.recipes.getAll, {});
  return docs as Recipe[];
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const client = getClient();
  const doc = await client.query(api.recipes.getBySlug, { slug });
  return (doc as Recipe | null);
}

export async function addRecipe(recipe: Recipe): Promise<Recipe> {
  const client = getClient();
  const { id, ...rest } = recipe;
  await client.mutation(api.recipes.add, { recipeId: id, ...rest } as Parameters<typeof client.mutation<typeof api.recipes.add>>[1]);
  return recipe;
}

export async function updateRecipe(slug: string, patch: Partial<Recipe>): Promise<Recipe | null> {
  const client = getClient();
  const updated = await client.mutation(api.recipes.update, { slug, patch });
  return (updated as Recipe | null);
}

export async function deleteRecipe(slug: string): Promise<boolean> {
  const client = getClient();
  return await client.mutation(api.recipes.remove, { slug });
}
