/**
 * POST /api/seed
 * Seeds Convex with the recipes from data/recipes.json.
 * Safe to call multiple times — Convex only seeds if the table is empty.
 * Protected by a SEED_SECRET env var so it can't be triggered publicly.
 */
import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import recipesData from '../../../../data/recipes.json';

export async function POST(req: Request) {
  const secret = req.headers.get('x-seed-secret');
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_CONVEX_URL not set' }, { status: 500 });
  }

  const client = new ConvexHttpClient(url);
  const result = await client.mutation(api.recipes.seedMany, {
    recipes: recipesData.recipes,
  });

  return NextResponse.json(result);
}
