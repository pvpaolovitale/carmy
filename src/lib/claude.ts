import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

/**
 * Reads a key from .env.local directly — used as fallback when the system
 * has an empty env var that overrides the file (common in dev environments).
 */
function readKeyFromEnvFile(keyName: string): string | undefined {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(new RegExp(`^${keyName}=(.+)$`, 'm'));
    return match?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

// Lazy singleton — created on first call so env vars are fully loaded.
// Falls back to reading .env.local directly if the system env var is empty.
let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY || readKeyFromEnvFile('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment or .env.local');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const client = getClient();
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = msg.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

export async function callClaudeJSON<T>(systemPrompt: string, userMessage: string): Promise<T> {
  const text = await callClaude(systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown fences, no explanation, just the raw JSON object.', userMessage);
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as T;
}
