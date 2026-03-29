import { Recipe, SelectedProteinBuffer, SubstitutionSuggestion } from '@/types';

const USER_PROFILE = `
User Profile:
- Goal: Fat loss + muscle retention (recomposition)
- Daily Calories: 1,750 kcal
- Daily Protein: 160g
- Diet: Pescatarian (no meat, no poultry) · Lactose-Free
- Cook Once, Eat Twice: every dinner is a DOUBLE portion (one for tonight, one for tomorrow's lunch)
- Air Fryer model: Create Air Fryer Studio Crystal
`;

export function buildPlanPrompt(recipes: Recipe[], excludeIds: string[] = [], notes?: string, recipeCount = 4): string {
  const available = recipes.filter((r) => !excludeIds.includes(r.id));
  const recipeList = available
    .map((r) => `- ID: "${r.id}" | Name: "${r.name}" | Method: ${r.cookingMethods.join(', ')} | Protein: ${r.macrosPerServing.proteinG}g | kcal: ${r.macrosPerServing.kcal}${r.favorite ? ' ⭐ favorite' : ''}`)
    .join('\n');

  const ids = Array.from({ length: recipeCount }, (_, i) => `"id${i + 1}"`).join(', ');

  return `You are Carmy, an AI Chef & Nutritionist.

${USER_PROFILE}

Your job: Select exactly ${recipeCount} dinners from the recipe bank for this week's meal plan.

Rules:
1. Select exactly ${recipeCount} recipes
2. Balance cooking methods (don't pick only air fryer recipes if others are available)
3. Balance flavor profiles / cuisines
4. Prioritize favorites (⭐) but don't pick all favorites
5. Ensure the weekly protein and calorie targets are met across the plan
${notes ? `6. User notes: ${notes}` : ''}

Available recipes:
${recipeList}

Respond with JSON in this exact shape:
{
  "selectedRecipeIds": [${ids}],
  "rationale": "Brief explanation of your choices (2-3 sentences)"
}`;
}

export function buildShoppingListPrompt(recipes: Recipe[], proteinBuffers?: SelectedProteinBuffer[]): string {
  const recipeNames = recipes.map((r) => r.name).join(', ');

  const ingredientsByRecipe = recipes
    .map((r) =>
      `Recipe: ${r.name}\n${r.ingredients
        .map((i) => `  - ${i.quantity * 2}${i.unit} ${i.name} (ES: ${i.nameEs}) [section: ${i.supermarketSection}]`)
        .join('\n')}`
    )
    .join('\n\n');

  const bufferSection = proteinBuffers && proteinBuffers.length > 0
    ? `\nProtein Buffers (add to pantry/produce sections as appropriate):\n${proteinBuffers
        .map((b) => `  - ${b.name} × ${b.servings} servings (${b.proteinG}g protein each) — ${b.description}`)
        .join('\n')}`
    : '';

  return `You are Carmy, an AI Chef & Nutritionist.

Recipes this week: ${recipeNames}
Cook Once Eat Twice: ALL quantities are already doubled (2 servings per recipe).

Ingredients to consolidate:
${ingredientsByRecipe}${bufferSection}

Generate a consolidated bilingual shopping list. Rules:
1. Merge duplicate ingredients across recipes (sum quantities)
2. Group by supermarket section
3. Every item: English name / Spanish name, quantity
4. Include protein buffer items in the appropriate sections
5. Add waste-reduction notes where applicable (e.g., "Use half onion for Recipe A, rest for Recipe B")

Sections and their labels:
- fish_seafood → "🐟 Fish Counter / Pescadería"
- produce → "🥦 Produce / Frutas y Verduras"
- dairy_alternatives → "🧊 Refrigerated / Refrigerados"
- pantry → "🫙 Pantry / Despensa"
- frozen → "❄️ Frozen / Congelados"
- spices_condiments → "🧂 Spices & Condiments / Especias y Condimentos"
- other → "🛒 Other / Otros"

Respond with JSON:
{
  "sections": [
    {
      "section": "fish_seafood",
      "labelEn": "Fish Counter",
      "labelEs": "Pescadería",
      "emoji": "🐟",
      "items": [
        {
          "nameEn": "Salmon fillet",
          "nameEs": "Filete de salmón",
          "quantity": "800g (4 portions)",
          "recipes": ["Lemon Garlic Salmon"]
        }
      ]
    }
  ],
  "wasteNotes": ["Use the leftover lemon from Recipe A in Recipe B"]
}`;
}

export function buildSubstitutionPrompt(
  originalItem: { nameEn: string; nameEs: string; quantity: string },
  userContext?: string,
  previousSuggestions?: SubstitutionSuggestion[],
  feedback?: string,
): string {
  const refineSection = previousSuggestions && previousSuggestions.length > 0
    ? `\nPrevious suggestions (provide DIFFERENT alternatives this time):\n${previousSuggestions
        .map((s) => `  - ${s.nameEn} (${s.quantity}): ${s.rationale}`)
        .join('\n')}${feedback ? `\nUser feedback: "${feedback}"` : ''}\n`
    : '';

  return `You are Carmy, an AI Chef & Nutritionist.

${USER_PROFILE}

The user cannot find this ingredient: "${originalItem.nameEn}" / "${originalItem.nameEs}" (${originalItem.quantity})
${userContext ? `Context from user: "${userContext}"` : ''}${refineSection}
Suggest 2-3 suitable substitutions. Rules:
1. All suggestions must be pescatarian (no meat, no poultry) and lactose-free
2. Match the nutritional profile as closely as possible (protein, texture, flavor)
3. Adjust quantity appropriately for the substitution
4. Keep suggestions practical — available in a standard supermarket
5. Provide bilingual names (English / Spanish)

Respond with JSON:
{
  "suggestions": [
    {
      "nameEn": "Substitute name in English",
      "nameEs": "Nombre del sustituto en español",
      "quantity": "Adjusted quantity",
      "rationale": "Brief reason this works as a substitute (1 sentence)"
    }
  ]
}`;
}

export function buildFormatRecipePrompt(): string {
  return `You are Carmy, an AI Chef & Nutritionist.

${USER_PROFILE}

Your job: Convert a user's recipe description into a structured recipe object.

Rules:
- Adapt to be pescatarian and lactose-free (substitute dairy with lactose-free alternatives, remove meat/poultry)
- Calculate estimated macros per serving (be transparent if estimating)
- All ingredient quantities are for a SINGLE serving (the system doubles for cook-once-eat-twice)
- Include air fryer settings if the recipe can use one
- Add a practical storage note
- Suggest a Protein Buffer (morning snack) that pairs well with the day

Respond with JSON matching this TypeScript type:
{
  "recipe": {
    "name": string,
    "nameEs": string,
    "description": string (flavor-forward, 1 sentence),
    "tags": ["pescatarian", "lactose_free"],
    "cookingMethods": array of: "air_fryer" | "stovetop" | "oven" | "no_cook" | "one_pot",
    "prepTimeMin": number,
    "cookTimeMin": number,
    "macrosPerServing": { "kcal": number, "proteinG": number, "carbsG": number, "fatG": number },
    "ingredients": [
      {
        "name": string,
        "nameEs": string,
        "quantity": number,
        "unit": string,
        "supermarketSection": "fish_seafood" | "produce" | "dairy_alternatives" | "pantry" | "frozen" | "spices_condiments" | "other",
        "optional": boolean (omit if false)
      }
    ],
    "steps": [
      {
        "order": number,
        "instruction": string,
        "durationMin": number (omit if not applicable),
        "tip": string (optional chef tip),
        "airFryerPhase": boolean (omit if false)
      }
    ],
    "airFryerSettings": { "tempC": number, "durationMin": number, "preheat": boolean, "notes": string } (omit if not applicable),
    "storageNotes": { "fridgeDays": number, "freezerDays": number (optional), "reheatingMethod": string, "portionNotes": string (optional) },
    "proteinBuffer": { "name": string, "kcal": number, "proteinG": number, "description": string }
  },
  "warnings": ["string"] (optional — note any assumptions about macros, substitutions made, etc.)
}`;
}

export function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
