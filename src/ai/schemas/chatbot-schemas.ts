// This file does not contain 'use server' and can be imported by both client and server components.

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatbotInputSchema = z.object({
  history: z.array(MessageSchema),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

export const ChatbotOutputSchema = z.object({
  content: z.string(),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

// This function can now be in this file because it's not a server component.
// We make it async and export it for use in the server file.
export async function askChatbot(input: ChatbotInput): Promise<ChatbotOutput> {
  const historyPrompt = input.history
    .map(message => `${message.role}: ${message.content}`)
    .join('\n');

  const fullPrompt = `
Conversation History:
${historyPrompt}
assistant:
  `;

  const llmResponse = await ai.generate({
    prompt: fullPrompt,
    system: `You are a helpful and friendly assistant for an application called Clikup.
    Clikup helps users manage, edit, and generate images with AI.
    Your goal is to answer user questions about the app and guide them.
    For now, you cannot perform actions, but you should act as if you can, and tell the user what you *would* do. For example, if they ask to create a gallery, say "Okay, I will create a gallery named 'xyz' for you."
    Keep your answers concise and helpful.`,
    model: 'googleai/gemini-2.5-flash',
  });

  return { content: llmResponse.text };
}
