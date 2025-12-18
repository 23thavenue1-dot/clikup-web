'use server';

import { ai } from '@/ai/genkit';
import { askChatbot, type ChatbotOutput, type ChatbotInput, MessageSchema } from '@/ai/schemas/chatbot-schemas';

// The logic is now inside the schema file to be co-located with its types.
// This server file just re-exports the async server function.
export { askChatbot };
