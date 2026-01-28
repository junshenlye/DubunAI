import { getGeminiClient } from './client';
import { SYSTEM_PROMPT } from './prompts';
import type { ContextMessage } from '@/lib/dag/context';

const MODEL = 'gemini-2.5-flash';

/**
 * Generate a streaming response from Gemini.
 * Returns an async iterable of text chunks.
 */
export async function* streamGeminiResponse(
  contextMessages: ContextMessage[],
  systemPrompt: string = SYSTEM_PROMPT
): AsyncGenerator<string> {
  const client = getGeminiClient();

  const response = await client.models.generateContentStream({
    model: MODEL,
    contents: contextMessages,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) {
      yield text;
    }
  }
}

/**
 * Generate a non-streaming response from Gemini (used for /explore proposals).
 */
export async function generateGeminiResponse(
  contextMessages: ContextMessage[],
  systemPrompt: string = SYSTEM_PROMPT
): Promise<string> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: contextMessages,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  return response.text ?? '';
}

/**
 * Generate a structured JSON response from Gemini (used for /explore).
 */
export async function generateStructuredResponse(
  contextMessages: ContextMessage[],
  systemPrompt: string
): Promise<string> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: contextMessages,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
    },
  });

  return response.text ?? '{}';
}
