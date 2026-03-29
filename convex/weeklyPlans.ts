import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { Id } from './_generated/dataModel';
import { api } from './_generated/api';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getActivePlan = query({
  args: { weekStartDate: v.string() },
  handler: async (ctx, { weekStartDate }) => {
    return await ctx.db
      .query('weeklyPlans')
      .withIndex('by_weekStartDate', (q) => q.eq('weekStartDate', weekStartDate))
      .first();
  },
});

export const getPlanById = query({
  args: { id: v.id('weeklyPlans') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getShoppingItems = query({
  args: { weeklyPlanId: v.id('weeklyPlans') },
  handler: async (ctx, { weeklyPlanId }) => {
    return await ctx.db
      .query('shoppingItems')
      .withIndex('by_weeklyPlanId', (q) => q.eq('weeklyPlanId', weeklyPlanId))
      .collect();
  },
});

export const getRecipeCompletions = query({
  args: { weeklyPlanId: v.id('weeklyPlans') },
  handler: async (ctx, { weeklyPlanId }) => {
    return await ctx.db
      .query('recipeCompletions')
      .withIndex('by_weeklyPlanId', (q) => q.eq('weeklyPlanId', weeklyPlanId))
      .collect();
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createPlan = mutation({
  args: {
    weekStartDate: v.string(),
    recipeCount: v.number(),
    dinnerSlots: v.array(
      v.object({ day: v.string(), recipeId: v.string(), confirmed: v.boolean() })
    ),
    rationale: v.optional(v.string()),
    selectedProteinBuffers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          kcal: v.number(),
          proteinG: v.number(),
          description: v.string(),
          servings: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('weeklyPlans', {
      weekStartDate: args.weekStartDate,
      status: 'planning',
      recipeCount: args.recipeCount,
      dinnerSlots: args.dinnerSlots,
      rationale: args.rationale,
      selectedProteinBuffers: args.selectedProteinBuffers,
    });
    return id;
  },
});

export const updateDinnerSlots = mutation({
  args: {
    id: v.id('weeklyPlans'),
    dinnerSlots: v.array(
      v.object({ day: v.string(), recipeId: v.string(), confirmed: v.boolean() })
    ),
  },
  handler: async (ctx, { id, dinnerSlots }) => {
    await ctx.db.patch(id, { dinnerSlots });
  },
});

export const updateSelectedBuffers = mutation({
  args: {
    id: v.id('weeklyPlans'),
    selectedProteinBuffers: v.array(
      v.object({
        name: v.string(),
        kcal: v.number(),
        proteinG: v.number(),
        description: v.string(),
        servings: v.number(),
      })
    ),
  },
  handler: async (ctx, { id, selectedProteinBuffers }) => {
    await ctx.db.patch(id, { selectedProteinBuffers });
  },
});

export const updatePlanStatus = mutation({
  args: {
    id: v.id('weeklyPlans'),
    status: v.union(
      v.literal('planning'),
      v.literal('shopping'),
      v.literal('cooking'),
      v.literal('done'),
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});

export const confirmPlan = mutation({
  args: { id: v.id('weeklyPlans') },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: 'shopping',
      confirmedAt: new Date().toISOString(),
      shoppingListGeneratedAt: new Date().toISOString(),
    });
  },
});

export const bulkInsertShoppingItems = mutation({
  args: {
    weeklyPlanId: v.id('weeklyPlans'),
    items: v.array(
      v.object({
        section: v.string(),
        nameEn: v.string(),
        nameEs: v.string(),
        quantity: v.string(),
        recipes: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, { weeklyPlanId, items }) => {
    for (const item of items) {
      await ctx.db.insert('shoppingItems', {
        weeklyPlanId,
        section: item.section,
        nameEn: item.nameEn,
        nameEs: item.nameEs,
        quantity: item.quantity,
        recipes: item.recipes,
        checked: false,
      });
    }
  },
});

export const deleteShoppingItemsForPlan = mutation({
  args: { weeklyPlanId: v.id('weeklyPlans') },
  handler: async (ctx, { weeklyPlanId }) => {
    const batch = await ctx.db
      .query('shoppingItems')
      .withIndex('by_weeklyPlanId', (q) => q.eq('weeklyPlanId', weeklyPlanId))
      .take(100);

    for (const item of batch) {
      await ctx.db.delete(item._id);
    }

    // If there are more items, schedule continuation
    if (batch.length === 100) {
      await ctx.scheduler.runAfter(0, api.weeklyPlans.deleteShoppingItemsForPlan, { weeklyPlanId });
    }
  },
});

export const toggleShoppingItem = mutation({
  args: {
    itemId: v.id('shoppingItems'),
    checked: v.boolean(),
  },
  handler: async (ctx, { itemId, checked }) => {
    await ctx.db.patch(itemId, { checked });
  },
});

export const acceptSubstitution = mutation({
  args: {
    itemId: v.id('shoppingItems'),
    substitution: v.object({
      originalNameEn: v.string(),
      originalNameEs: v.string(),
      originalQuantity: v.string(),
      newNameEn: v.string(),
      newNameEs: v.string(),
      newQuantity: v.string(),
      acceptedAt: v.string(),
    }),
  },
  handler: async (ctx, { itemId, substitution }) => {
    await ctx.db.patch(itemId, { substitution });
  },
});

export const markRecipeDone = mutation({
  args: {
    weeklyPlanId: v.id('weeklyPlans'),
    recipeId: v.string(),
  },
  handler: async (ctx, { weeklyPlanId, recipeId }) => {
    // Check if already marked done (avoid duplicates)
    const existing = await ctx.db
      .query('recipeCompletions')
      .withIndex('by_weeklyPlanId', (q) => q.eq('weeklyPlanId', weeklyPlanId))
      .collect();
    const alreadyDone = existing.some((c) => c.recipeId === recipeId);
    if (alreadyDone) return;

    await ctx.db.insert('recipeCompletions', {
      weeklyPlanId,
      recipeId,
      completedAt: new Date().toISOString(),
    });
  },
});

export const markBufferDone = mutation({
  args: { weeklyPlanId: v.id('weeklyPlans'), bufferName: v.string() },
  handler: async (ctx, { weeklyPlanId, bufferName }) => {
    const key = `buffer::${bufferName}`;
    const existing = await ctx.db
      .query('recipeCompletions')
      .withIndex('by_weeklyPlanId', (q) => q.eq('weeklyPlanId', weeklyPlanId))
      .collect();
    if (existing.some((c) => c.recipeId === key)) return;
    await ctx.db.insert('recipeCompletions', {
      weeklyPlanId,
      recipeId: key,
      completedAt: new Date().toISOString(),
    });
  },
});

export const updateMealSlots = mutation({
  args: {
    id: v.id('weeklyPlans'),
    mealSlots: v.array(v.object({
      day: v.string(),
      mealType: v.union(v.literal('lunch'), v.literal('dinner')),
      recipeId: v.optional(v.string()),
    })),
    dinnerSlots: v.array(v.object({
      day: v.string(),
      recipeId: v.string(),
      confirmed: v.boolean(),
    })),
  },
  handler: async (ctx, { id, mealSlots, dinnerSlots }) => {
    await ctx.db.patch(id, { mealSlots, dinnerSlots });
  },
});

export const updateBufferSlots = mutation({
  args: {
    id: v.id('weeklyPlans'),
    bufferSlots: v.array(v.object({
      day: v.string(),
      mealTime: v.union(v.literal('lunch'), v.literal('dinner')),
      bufferName: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { id, bufferSlots }) => {
    await ctx.db.patch(id, { bufferSlots });
  },
});

export const finishWeek = mutation({
  args: { id: v.id('weeklyPlans') },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: 'done',
      completedAt: new Date().toISOString(),
    });
  },
});

export const deletePlan = mutation({
  args: { id: v.id('weeklyPlans') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
