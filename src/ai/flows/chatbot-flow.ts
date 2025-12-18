
'use server';

import { ai } from '@/ai/genkit';
import { type ChatbotOutput, type ChatbotInput } from '@/ai/schemas/chatbot-schemas';

// This function is now in a 'use server' file.
// Client components can import and call it directly.
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
