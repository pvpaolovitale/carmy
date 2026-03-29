import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  weeklyPlans: defineTable({
    weekStartDate: v.string(),        // ISO "YYYY-MM-DD" of Monday
    status: v.union(
      v.literal('planning'),
      v.literal('shopping'),
      v.literal('cooking'),
      v.literal('done'),
    ),
    recipeCount: v.number(),          // user-chosen 2–7
    dinnerSlots: v.array(
      v.object({
        day: v.string(),
        recipeId: v.string(),
        confirmed: v.boolean(),
      })
    ),
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
    rationale: v.optional(v.string()),
    shoppingListGeneratedAt: v.optional(v.string()),
    confirmedAt: v.optional(v.string()),
    completedAt: v.optional(v.string()),
    mealSlots: v.optional(v.array(v.object({
      day: v.string(),
      mealType: v.union(v.literal('lunch'), v.literal('dinner')),
      recipeId: v.optional(v.string()),
    }))),
    bufferSlots: v.optional(v.array(v.object({
      day: v.string(),
      mealTime: v.union(v.literal('lunch'), v.literal('dinner')),
      bufferName: v.optional(v.string()),
    }))),
  }).index('by_weekStartDate', ['weekStartDate']),

  shoppingItems: defineTable({
    weeklyPlanId: v.id('weeklyPlans'),
    section: v.string(),
    nameEn: v.string(),
    nameEs: v.string(),
    quantity: v.string(),
    recipes: v.array(v.string()),
    checked: v.boolean(),
    substitution: v.optional(
      v.object({
        originalNameEn: v.string(),
        originalNameEs: v.string(),
        originalQuantity: v.string(),
        newNameEn: v.string(),
        newNameEs: v.string(),
        newQuantity: v.string(),
        acceptedAt: v.string(),
      })
    ),
  }).index('by_weeklyPlanId', ['weeklyPlanId']),

  recipeCompletions: defineTable({
    weeklyPlanId: v.id('weeklyPlans'),
    recipeId: v.string(),
    completedAt: v.string(),
  }).index('by_weeklyPlanId', ['weeklyPlanId']),

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
