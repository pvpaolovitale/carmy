import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { PROMPT_SETTING_KEYS } from './prompts';

function getClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is not set');
  return new ConvexHttpClient(url);
}

export interface PromptSettings {
  userProfile?: string;
  planPrompt?: string;
  shoppingListPrompt?: string;
  substitutionPrompt?: string;
  formatRecipePrompt?: string;
  formatBufferPrompt?: string;
}

export async function getPromptSettings(): Promise<PromptSettings> {
  try {
    const client = getClient();
    const all = await client.query(api.settings.getAllSettings, {}) as Record<string, string>;
    return {
      userProfile: all[PROMPT_SETTING_KEYS.userProfile] || undefined,
      planPrompt: all[PROMPT_SETTING_KEYS.planPrompt] || undefined,
      shoppingListPrompt: all[PROMPT_SETTING_KEYS.shoppingListPrompt] || undefined,
      substitutionPrompt: all[PROMPT_SETTING_KEYS.substitutionPrompt] || undefined,
      formatRecipePrompt: all[PROMPT_SETTING_KEYS.formatRecipePrompt] || undefined,
      formatBufferPrompt: all[PROMPT_SETTING_KEYS.formatBufferPrompt] || undefined,
    };
  } catch {
    // If settings can't be loaded, fall back to defaults
    return {};
  }
}
