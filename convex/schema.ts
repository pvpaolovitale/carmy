import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  recipes: defineTable({
    // Identity
    recipeId: v.string(),   // our own UUID (kept as "id" in app)
    slug: v.string(),
    name: v.string(),
    nameEs: v.optional(v.string()),
    description: v.string(),

    // Classification
    tags: v.array(v.string()),
    cookingMethods: v.array(v.string()),
    prepTimeMin: v.number(),
    cookTimeMin: v.number(),
    favorite: v.optional(v.boolean()),

    // Macros
    macrosPerServing: v.object({
      kcal: v.number(),
      proteinG: v.number(),
      carbsG: v.number(),
      fatG: v.number(),
    }),

    // Ingredients
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

    // Steps
    steps: v.array(
      v.object({
        order: v.number(),
        instruction: v.string(),
        durationMin: v.optional(v.number()),
        tip: v.optional(v.string()),
        airFryerPhase: v.optional(v.boolean()),
      })
    ),

    // Air fryer
    airFryerSettings: v.optional(
      v.object({
        tempC: v.number(),
        durationMin: v.number(),
        preheat: v.boolean(),
        notes: v.optional(v.string()),
      })
    ),

    // Storage
    storageNotes: v.object({
      fridgeDays: v.number(),
      freezerDays: v.optional(v.number()),
      reheatingMethod: v.string(),
      portionNotes: v.optional(v.string()),
    }),

    // Protein buffer pairing
    proteinBuffer: v.optional(
      v.object({
        name: v.string(),
        kcal: v.number(),
        proteinG: v.number(),
        description: v.string(),
      })
    ),

    // Meta
    createdAt: v.string(),
    source: v.string(),
  })
    .index('by_slug', ['slug'])
    .index('by_recipeId', ['recipeId']),
});
