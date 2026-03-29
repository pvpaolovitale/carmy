import { NextResponse } from 'next/server';
import { callClaudeJSON } from '@/lib/claude';
import { buildFormatProteinBufferPrompt } from '@/lib/prompts';
import { getPromptSettings } from '@/lib/settings';

interface FormatBufferRequest {
  rawDescription: string;
}

interface FormatBufferResponse {
  buffer: {
    name: string;
    kcal: number;
    proteinG: number;
    description: string;
  };
  warnings?: string[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FormatBufferRequest;

    if (!body.rawDescription?.trim()) {
      return NextResponse.json({ error: 'rawDescription is required' }, { status: 400 });
    }

    const settings = await getPromptSettings();
    const systemPrompt = buildFormatProteinBufferPrompt(settings.formatBufferPrompt, settings.userProfile);
    const result = await callClaudeJSON<FormatBufferResponse>(
      systemPrompt,
      `Format this protein buffer:\n\n${body.rawDescription}`
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to format protein buffer' }, { status: 500 });
  }
}
