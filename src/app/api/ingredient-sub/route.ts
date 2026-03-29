import { NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/claude';
import { buildSubstitutionPrompt } from '@/lib/prompts';
import { IngredientSubRequest, IngredientSubResponse } from '@/types';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IngredientSubRequest;

    if (!body.originalItem?.nameEn) {
      return NextResponse.json({ error: 'originalItem is required' }, { status: 400 });
    }

    const systemPrompt = buildSubstitutionPrompt(
      body.originalItem,
      body.userContext,
      body.previousSuggestions,
      body.feedback,
    );

    const result = await callClaudeJSON<IngredientSubResponse>(
      systemPrompt,
      'Suggest substitutions for this ingredient.'
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate substitutions' }, { status: 500 });
  }
}
