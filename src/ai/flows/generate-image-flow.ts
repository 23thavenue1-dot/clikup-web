'use server';
/**
 * @fileOverview Flow Genkit pour la génération d'image à partir d'un prompt textuel ou l'édition d'une image existante.
 *
 * - generateImage: Fonction pour créer une image de zéro.
 * - editImage: Fonction pour modifier une image existante.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- GÉRÉRATION D'IMAGE ---

const GenerateImageInputSchema = z.object({
  prompt: z
    .string()
    .min(3)
    .describe(
      "L'instruction en langage naturel pour créer l'image (ex: 'Un chaton jouant avec une pelote de laine, style peinture à l'huile')."
    ),
  aspectRatio: z.string().optional().describe("Le ratio d'aspect de l'image à générer (ex: '1:1', '16:9')."),
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
  async ({ prompt, aspectRatio }) => {
    
    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: prompt,
        config: {
             aspectRatio: aspectRatio, // Passer le ratio d'aspect ici
             safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
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


// --- ÉDITION D'IMAGE ---

const EditImageInputSchema = z.object({
  imageUrl: z.string().describe("L'URL de l'image source à modifier (data URI)."),
  prompt: z.string().min(3).describe("L'instruction pour modifier l'image."),
});
export type EditImageInput = z.infer<typeof EditImageInputSchema>;

export type EditImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function editImage(input: EditImageInput): Promise<EditImageOutput> {
  return editImageFlow(input);
}

const editImageFlow = ai.defineFlow(
  {
    name: 'editImageFlow',
    inputSchema: EditImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ imageUrl, prompt }) => {
    
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
            { media: { url: imageUrl } },
            { text: prompt },
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
            safetySettings: [
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            ],
        },
    });

    if (!media || !media.url) {
        throw new Error("L'IA n'a pas pu générer une nouvelle image.");
    }
    
    return {
      imageUrl: media.url,
    };
  }
);
