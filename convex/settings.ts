import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const doc = await ctx.db
      .query('appSettings')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first();
    return doc?.value ?? null;
  },
});

export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query('appSettings').collect();
    return Object.fromEntries(docs.map((d) => [d.key, d.value]));
  },
});

export const upsertSetting = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const existing = await ctx.db
      .query('appSettings')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value });
    } else {
      await ctx.db.insert('appSettings', { key, value });
    }
  },
});

export const deleteSetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const existing = await ctx.db
      .query('appSettings')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});
