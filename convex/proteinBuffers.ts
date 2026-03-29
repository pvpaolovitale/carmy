import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('proteinBuffers').collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    kcal: v.number(),
    proteinG: v.number(),
    description: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Avoid duplicate names
    const existing = await ctx.db
      .query('proteinBuffers')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert('proteinBuffers', args);
  },
});

export const remove = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const doc = await ctx.db
      .query('proteinBuffers')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first();
    if (!doc) return false;
    await ctx.db.delete(doc._id);
    return true;
  },
});
