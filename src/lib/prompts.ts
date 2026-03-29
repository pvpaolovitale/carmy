import { Recipe, SelectedProteinBuffer, SubstitutionSuggestion } from '@/types';

// ─── Default User Profile ─────────────────────────────────────────────────────

export const DEFAULT_USER_PROFILE = `User Profile:
- Goal: Fat loss + muscle retention (recomposition)
- Daily Calories: 1,750 kcal
- Daily Protein: 160g
- Diet: Pescatarian (no meat, no poultry) · Lactose-Free
- Cook Once, Eat Twice: every dinner is a DOUBLE portion (one for tonight, one for tomorrow's lunch)
- Air Fryer model: Create Air Fryer Studio Crystal`;

// ─── Template engine ──────────────────────────────────────────────────────────

export function applyTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
    template
  );
}

// ─── Default prompt templates ─────────────────────────────────────────────────
// These are the templates shown + editable in Settings.
// Dynamic sections (recipe lists etc.) are injected via {{PLACEHOLDER}} at runtime.

export const DEFAULT_PLAN_PROMPT_TEMPLATE = `You are Carmy, an AI Chef & Nutritionist.

{{USER_PROFILE}}

Your job: Select exactly {{RECIPE_COUNT}} dinners from the recipe bank for this week's meal plan.

Rules:
1. Select exactly {{RECIPE_COUNT}} recipes
2. Balance cooking methods (don't pick only air fryer recipes if others are available)
3. Balance flavor profiles / cuisines
4. Prioritize favorites (⭐) but don't pick all favorites
5. Ensure the weekly protein and calorie targets are met across the plan
{{NOTES_RULE}}
Available recipes:
{{RECIPE_LIST}}

Respond with JSON in this exact shape:
{
  "selectedRecipeIds": [{{IDS}}],
  "rationale": "Brief explanation of your choices (2-3 sentences)"
}`;

export const DEFAULT_SHOPPING_PROMPT_TEMPLATE = `You are Carmy, an AI Chef & Nutritionist.

Recipes this week: {{RECIPE_NAMES}}
Cook Once Eat Twice: ALL quantities are already doubled (2 servings per recipe).

Ingredients to consolidate:
{{INGREDIENTS_BY_RECIPE}}{{BUFFER_SECTION}}

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

export const DEFAULT_SUBSTITUTION_PROMPT_TEMPLATE = `You are Carmy, an AI Chef & Nutritionist.

{{USER_PROFILE}}

The user cannot find this ingredient: "{{ITEM_EN}}" / "{{ITEM_ES}}" ({{ITEM_QTY}})
{{USER_CONTEXT}}{{PREVIOUS_SUGGESTIONS}}
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

export const DEFAULT_FORMAT_RECIPE_PROMPT = `You are Carmy, an AI Chef & Nutritionist.

{{USER_PROFILE}}

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

export const DEFAULT_FORMAT_BUFFER_PROMPT = `You are Carmy, an AI Chef & Nutritionist.

{{USER_PROFILE}}

Your job: Format a protein buffer (morning/afternoon snack) based on the user's description.

Rules:
- Must be pescatarian and lactose-free
- Focus on high-protein, practical foods that complement the weekly meal plan
- Calculate estimated macros per serving
- Keep it simple: something that can be prepared in under 5 minutes

Respond with JSON:
{
  "buffer": {
    "name": string,
    "kcal": number,
    "proteinG": number,
    "description": string (one practical sentence describing the snack)
  },
  "warnings": ["string"] (optional — note any assumptions)
}`;

// ─── Prompt builder functions ─────────────────────────────────────────────────

export function buildPlanPrompt(
  recipes: Recipe[],
  excludeIds: string[] = [],
  notes?: string,
  recipeCount = 4,
  templateOverride?: string,
  userProfileOverride?: string
): string {
  const available = recipes.filter((r) => !excludeIds.includes(r.id));
  const recipeList = available
    .map((r) => `- ID: "${r.id}" | Name: "${r.name}" | Method: ${r.cookingMethods.join(', ')} | Protein: ${r.macrosPerServing.proteinG}g | kcal: ${r.macrosPerServing.kcal}${r.favorite ? ' ⭐ favorite' : ''}`)
    .join('\n');
  const ids = Array.from({ length: recipeCount }, (_, i) => `"id${i + 1}"`).join(', ');
  const template = templateOverride ?? DEFAULT_PLAN_PROMPT_TEMPLATE;
  return applyTemplate(template, {
    USER_PROFILE: userProfileOverride ?? DEFAULT_USER_PROFILE,
    RECIPE_COUNT: String(recipeCount),
    RECIPE_LIST: recipeList,
    IDS: ids,
    NOTES_RULE: notes ? `6. User notes: ${notes}` : '',
  });
}

export function buildShoppingListPrompt(
  recipes: Recipe[],
  proteinBuffers?: SelectedProteinBuffer[],
  templateOverride?: string
): string {
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
  const template = templateOverride ?? DEFAULT_SHOPPING_PROMPT_TEMPLATE;
  return applyTemplate(template, {
    RECIPE_NAMES: recipeNames,
    INGREDIENTS_BY_RECIPE: ingredientsByRecipe,
    BUFFER_SECTION: bufferSection,
  });
}

export function buildSubstitutionPrompt(
  originalItem: { nameEn: string; nameEs: string; quantity: string },
  userContext?: string,
  previousSuggestions?: SubstitutionSuggestion[],
  feedback?: string,
  templateOverride?: string,
  userProfileOverride?: string
): string {
  const refineSection = previousSuggestions && previousSuggestions.length > 0
    ? `\nPrevious suggestions (provide DIFFERENT alternatives this time):\n${previousSuggestions
        .map((s) => `  - ${s.nameEn} (${s.quantity}): ${s.rationale}`)
        .join('\n')}${feedback ? `\nUser feedback: "${feedback}"` : ''}\n`
    : '';
  const template = templateOverride ?? DEFAULT_SUBSTITUTION_PROMPT_TEMPLATE;
  return applyTemplate(template, {
    USER_PROFILE: userProfileOverride ?? DEFAULT_USER_PROFILE,
    ITEM_EN: originalItem.nameEn,
    ITEM_ES: originalItem.nameEs,
    ITEM_QTY: originalItem.quantity,
    USER_CONTEXT: userContext ? `Context from user: "${userContext}"\n` : '',
    PREVIOUS_SUGGESTIONS: refineSection,
  });
}

export function buildFormatRecipePrompt(templateOverride?: string, userProfileOverride?: string): string {
  const template = templateOverride ?? DEFAULT_FORMAT_RECIPE_PROMPT;
  return applyTemplate(template, {
    USER_PROFILE: userProfileOverride ?? DEFAULT_USER_PROFILE,
  });
}

export function buildFormatProteinBufferPrompt(templateOverride?: string, userProfileOverride?: string): string {
  const template = templateOverride ?? DEFAULT_FORMAT_BUFFER_PROMPT;
  return applyTemplate(template, {
    USER_PROFILE: userProfileOverride ?? DEFAULT_USER_PROFILE,
  });
}

export function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

// ─── Settings key constants ───────────────────────────────────────────────────

export const PROMPT_SETTING_KEYS = {
  userProfile: 'userProfile',
  planPrompt: 'planPromptTemplate',
  shoppingListPrompt: 'shoppingListPromptTemplate',
  substitutionPrompt: 'substitutionPromptTemplate',
  formatRecipePrompt: 'formatRecipePrompt',
  formatBufferPrompt: 'formatBufferPrompt',
} as const;

export type PromptSettingKey = (typeof PROMPT_SETTING_KEYS)[keyof typeof PROMPT_SETTING_KEYS];

export const PROMPT_SETTING_DEFAULTS: Record<PromptSettingKey, string> = {
  [PROMPT_SETTING_KEYS.userProfile]: DEFAULT_USER_PROFILE,
  [PROMPT_SETTING_KEYS.planPrompt]: DEFAULT_PLAN_PROMPT_TEMPLATE,
  [PROMPT_SETTING_KEYS.shoppingListPrompt]: DEFAULT_SHOPPING_PROMPT_TEMPLATE,
  [PROMPT_SETTING_KEYS.substitutionPrompt]: DEFAULT_SUBSTITUTION_PROMPT_TEMPLATE,
  [PROMPT_SETTING_KEYS.formatRecipePrompt]: DEFAULT_FORMAT_RECIPE_PROMPT,
  [PROMPT_SETTING_KEYS.formatBufferPrompt]: DEFAULT_FORMAT_BUFFER_PROMPT,
};

export const PROMPT_SETTING_METADATA: Record<PromptSettingKey, { label: string; description: string; variables?: string[] }> = {
  [PROMPT_SETTING_KEYS.userProfile]: {
    label: '👤 User Profile',
    description: 'Embedded in every prompt. Edit dietary restrictions, calorie targets, air fryer model, etc.',
  },
  [PROMPT_SETTING_KEYS.planPrompt]: {
    label: '📅 Weekly Plan Generation',
    description: 'Used when Carmy selects recipes for the week.',
    variables: ['{{USER_PROFILE}}', '{{RECIPE_COUNT}}', '{{RECIPE_LIST}}', '{{IDS}}', '{{NOTES_RULE}}'],
  },
  [PROMPT_SETTING_KEYS.shoppingListPrompt]: {
    label: '🛒 Shopping List',
    description: 'Used to generate the consolidated shopping list.',
    variables: ['{{RECIPE_NAMES}}', '{{INGREDIENTS_BY_RECIPE}}', '{{BUFFER_SECTION}}'],
  },
  [PROMPT_SETTING_KEYS.substitutionPrompt]: {
    label: '🔄 Ingredient Substitution',
    description: 'Used when asking Carmy for ingredient alternatives.',
    variables: ['{{USER_PROFILE}}', '{{ITEM_EN}}', '{{ITEM_ES}}', '{{ITEM_QTY}}', '{{USER_CONTEXT}}', '{{PREVIOUS_SUGGESTIONS}}'],
  },
  [PROMPT_SETTING_KEYS.formatRecipePrompt]: {
    label: '✍️ Format Recipe',
    description: 'Used to convert a recipe description into structured data.',
    variables: ['{{USER_PROFILE}}'],
  },
  [PROMPT_SETTING_KEYS.formatBufferPrompt]: {
    label: '💪 Format Protein Buffer',
    description: 'Used to format a standalone protein buffer from a description.',
    variables: ['{{USER_PROFILE}}'],
  },
};
