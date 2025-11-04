'use server';
/**
 * @fileOverview Flow Genkit pour l'édition d'image par IA en utilisant une instruction textuelle.
 *
 * - editImage: La fonction principale qui prend une URL d'image et un prompt, puis retourne la nouvelle image.
 * - EditImageInput: Le type d'entrée pour la fonction.
 * - EditImageOutput: Le type de sortie pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EditImageInputSchema = z.object({
  imageUrl: z
    .string()
    .url()
    .describe(
      "L'URL de l'image source à modifier, doit être un data URI ou une URL accessible publiquement."
    ),
  prompt: z
    .string()
    .min(3)
    .describe(
      "L'instruction en langage naturel pour modifier l'image (ex: 'Rends le ciel plus dramatique')."
    ),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

const EditImageOutputSchema = z.object({
  newImageUrl: z
    .string()
    .url()
    .describe(
      "L'URL de la nouvelle image générée, encodée en data URI (base64)."
    ),
});
export type EditImageOutput = z.infer<typeof EditImageOutputSchema>;

export async function editImage(input: EditImageInput): Promise<EditImageOutput> {
  return editImageFlow(input);
}

const editImageFlow = ai.defineFlow(
  {
    name: 'editImageFlow',
    inputSchema: EditImageInputSchema,
    outputSchema: EditImageOutputSchema,
  },
  async ({ imageUrl, prompt }) => {
    
    const { media } = await ai.generate({
        // Utilisation d'un modèle capable d'édition d'image
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: imageUrl } },
            { text: prompt },
        ],
        config: {
            // Le modèle doit pouvoir retourner du texte et une image
            responseModalities: ['TEXT', 'IMAGE'],
        },
    });

    if (!media || !media.url) {
        throw new Error("L'IA n'a pas pu générer une nouvelle image.");
    }
    
    return {
      newImageUrl: media.url,
    };
  }
);
