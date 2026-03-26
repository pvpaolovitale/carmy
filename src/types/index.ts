// ─── Diet & Profile ──────────────────────────────────────────────────────────

export type DietTag = 'pescatarian' | 'lactose_free' | 'gluten_free' | 'vegan';
export type CookingMethod = 'air_fryer' | 'stovetop' | 'oven' | 'no_cook' | 'one_pot';
export type SupermarketSection =
  | 'fish_seafood'
  | 'produce'
  | 'dairy_alternatives'
  | 'pantry'
  | 'frozen'
  | 'spices_condiments'
  | 'other';

// ─── Macros ──────────────────────────────────────────────────────────────────

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// ─── Recipe ──────────────────────────────────────────────────────────────────

export interface Ingredient {
  name: string;
  nameEs: string;
  quantity: number;
  unit: string;
  supermarketSection: SupermarketSection;
  optional?: boolean;
}

export interface CookingStep {
  order: number;
  instruction: string;
  durationMin?: number;
  tip?: string;
  airFryerPhase?: boolean;
}

export interface AirFryerSettings {
  tempC: number;
  durationMin: number;
  preheat: boolean;
  notes?: string;
}

export interface StorageNotes {
  fridgeDays: number;
  freezerDays?: number;
  reheatingMethod: string;
  portionNotes?: string;
}

export interface ProteinBuffer {
  name: string;
  kcal: number;
  proteinG: number;
  description: string;
}

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  nameEs?: string;
  description: string;
  tags: DietTag[];
  cookingMethods: CookingMethod[];
  prepTimeMin: number;
  cookTimeMin: number;
  macrosPerServing: Macros;
  ingredients: Ingredient[];
  steps: CookingStep[];
  airFryerSettings?: AirFryerSettings;
  storageNotes: StorageNotes;
  proteinBuffer?: ProteinBuffer;
  createdAt: string;
  source: 'user' | 'ai_formatted';
  favorite?: boolean;
}

export interface RecipesDB {
  version: number;
  lastUpdated: string;
  recipes: Recipe[];
}

// ─── Weekly Plan ─────────────────────────────────────────────────────────────

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DinnerSlot {
  day: DayOfWeek;
  recipeId: string;
  recipe?: Recipe;
  confirmed: boolean;
}

export interface WeeklyPlan {
  id: string;
  weekStartDate: string;
  dinnerSlots: DinnerSlot[];
  shoppingList?: ShoppingList;
  confirmedAt?: string;
}

// ─── Shopping List ───────────────────────────────────────────────────────────

export interface ShoppingItem {
  nameEn: string;
  nameEs: string;
  quantity: string;
  recipes: string[];
}

export interface ShoppingSection {
  section: SupermarketSection;
  labelEn: string;
  labelEs: string;
  items: ShoppingItem[];
  emoji: string;
}

export interface ShoppingList {
  generatedAt: string;
  sections: ShoppingSection[];
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface GeneratePlanRequest {
  excludeRecipeIds?: string[];
  notes?: string;
}

export interface GeneratePlanResponse {
  selectedRecipeIds: string[];
  rationale: string;
}

export interface FormatRecipeRequest {
  rawDescription: string;
}

export interface FormatRecipeResponse {
  recipe: Omit<Recipe, 'id' | 'slug' | 'createdAt' | 'source'>;
  warnings?: string[];
}
