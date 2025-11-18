'use server';
/**
 * @fileOverview Flow Genkit pour la génération d'image à partir d'un prompt textuel.
 *
 * - generateImage: La fonction principale qui prend un prompt et retourne l'image générée.
 * - GenerateImageInput: Le type d'entrée pour la fonction.
 * - GenerateImageOutput: Le type de sortie pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z
    .string()
    .min(3)
    .describe(
      "L'instruction en langage naturel pour créer l'image (ex: 'Un chaton jouant avec une pelote de laine, style peinture à l'huile')."
    ),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "L'URL de la nouvelle image générée, encodée en data URI (base64)."
    ),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt }) => {
    
    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: prompt,
        config: {
             safetySettings: [
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE',
                },
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_NONE',
                },
                 {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_NONE',
                },
                 {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_NONE',
                }
            ],
        },
    });

    if (!media || !media.url) {
        throw new Error("L'IA n'a pas pu générer d'image pour cette instruction.");
    }
    
    return {
      imageUrl: media.url,
    };
  }
);
