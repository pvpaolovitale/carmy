import fs from 'fs/promises';
import path from 'path';
import { Recipe, RecipesDB } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'recipes.json');

// Simple write lock via promise chaining
let writeChain: Promise<void> = Promise.resolve();

async function readDB(): Promise<RecipesDB> {
  const raw = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(raw) as RecipesDB;
}

async function writeDB(db: RecipesDB): Promise<void> {
  db.lastUpdated = new Date().toISOString();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await readDB();
  return db.recipes;
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  const db = await readDB();
  return db.recipes.find((r) => r.slug === slug) ?? null;
}

export async function addRecipe(recipe: Recipe): Promise<Recipe> {
  writeChain = writeChain.then(async () => {
    const db = await readDB();
    db.recipes.push(recipe);
    await writeDB(db);
  });
  await writeChain;
  return recipe;
}

export async function updateRecipe(slug: string, patch: Partial<Recipe>): Promise<Recipe | null> {
  let updated: Recipe | null = null;
  writeChain = writeChain.then(async () => {
    const db = await readDB();
    const idx = db.recipes.findIndex((r) => r.slug === slug);
    if (idx === -1) return;
    db.recipes[idx] = { ...db.recipes[idx], ...patch };
    updated = db.recipes[idx];
    await writeDB(db);
  });
  await writeChain;
  return updated;
}

export async function deleteRecipe(slug: string): Promise<boolean> {
  let found = false;
  writeChain = writeChain.then(async () => {
    const db = await readDB();
    const before = db.recipes.length;
    db.recipes = db.recipes.filter((r) => r.slug !== slug);
    found = db.recipes.length < before;
    if (found) await writeDB(db);
  });
  await writeChain;
  return found;
}
