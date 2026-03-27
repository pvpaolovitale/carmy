import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToRecipe(doc: Record<string, unknown>) {
  // Map Convex doc back to our Recipe shape (recipeId → id, drop _id / _creationTime)
  const { _id, _creationTime, recipeId, ...rest } = doc as {
    _id: unknown;
    _creationTime: unknown;
    recipeId: string;
    [key: string]: unknown;
  };
  return { id: recipeId, ...rest };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query('recipes').collect();
    return docs.map(docToRecipe);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const doc = await ctx.db
      .query('recipes')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first();
    if (!doc) return null;
    return docToRecipe(doc as unknown as Record<string, unknown>);
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const add = mutation({
  args: {
    recipeId: v.string(),
    slug: v.string(),
    name: v.string(),
    nameEs: v.optional(v.string()),
    description: v.string(),
    tags: v.array(v.string()),
    cookingMethods: v.array(v.string()),
    prepTimeMin: v.number(),
    cookTimeMin: v.number(),
    favorite: v.optional(v.boolean()),
    macrosPerServing: v.object({
      kcal: v.number(),
      proteinG: v.number(),
      carbsG: v.number(),
      fatG: v.number(),
    }),
    ingredients: v.array(
      v.object({
        name: v.string(),
        nameEs: v.string(),
        quantity: v.number(),
        unit: v.string(),
        supermarketSection: v.string(),
        optional: v.optional(v.boolean()),
      })
    ),
    steps: v.array(
      v.object({
        order: v.number(),
        instruction: v.string(),
        durationMin: v.optional(v.number()),
        tip: v.optional(v.string()),
        airFryerPhase: v.optional(v.boolean()),
      })
    ),
    airFryerSettings: v.optional(
      v.object({
        tempC: v.number(),
        durationMin: v.number(),
        preheat: v.boolean(),
        notes: v.optional(v.string()),
      })
    ),
    storageNotes: v.object({
      fridgeDays: v.number(),
      freezerDays: v.optional(v.number()),
      reheatingMethod: v.string(),
      portionNotes: v.optional(v.string()),
    }),
    proteinBuffer: v.optional(
      v.object({
        name: v.string(),
        kcal: v.number(),
        proteinG: v.number(),
        description: v.string(),
      })
    ),
    createdAt: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert('recipes', args);
    return docId;
  },
});

export const update = mutation({
  args: {
    slug: v.string(),
    patch: v.any(),
  },
  handler: async (ctx, { slug, patch }) => {
    const doc = await ctx.db
      .query('recipes')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first();
    if (!doc) return null;

    // Never allow overwriting the slug or recipeId via patch
    const { id, recipeId: _rid, slug: _slug, ...safePatch } = patch as Record<string, unknown>;
    void id;
    await ctx.db.patch(doc._id, safePatch);
    const updated = await ctx.db.get(doc._id);
    return updated ? docToRecipe(updated as unknown as Record<string, unknown>) : null;
  },
});

export const remove = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const doc = await ctx.db
      .query('recipes')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first();
    if (!doc) return false;
    await ctx.db.delete(doc._id);
    return true;
  },
});

export const seedMany = mutation({
  args: {
    recipes: v.array(v.any()),
  },
  handler: async (ctx, { recipes }) => {
    // Only seed if the table is empty
    const existing = await ctx.db.query('recipes').first();
    if (existing) return { seeded: 0, skipped: true };

    for (const r of recipes) {
      const { id, ...rest } = r as { id: string; [k: string]: unknown };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.insert('recipes', { recipeId: id, ...rest } as any);
    }
    return { seeded: recipes.length, skipped: false };
  },
});
