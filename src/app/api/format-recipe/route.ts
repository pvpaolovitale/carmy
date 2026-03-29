import { NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/claude';
import { buildFormatRecipePrompt } from '@/lib/prompts';
import { getPromptSettings } from '@/lib/settings';
import { FormatRecipeRequest, FormatRecipeResponse } from '@/types';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FormatRecipeRequest;

    if (!body.rawDescription?.trim()) {
      return NextResponse.json({ error: 'rawDescription is required' }, { status: 400 });
    }

    const settings = await getPromptSettings();
    const systemPrompt = buildFormatRecipePrompt(settings.formatRecipePrompt, settings.userProfile);
    const result = await callClaudeJSON<FormatRecipeResponse>(
      systemPrompt,
      `Format this recipe:\n\n${body.rawDescription}`
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to format recipe' }, { status: 500 });
  }
}
